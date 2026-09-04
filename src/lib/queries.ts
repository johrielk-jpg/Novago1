import 'server-only';

import { getServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getSession, type Session } from '@/lib/session';
import { distanceKm } from '@/lib/geo';
import { demoProfiles } from '@/lib/demo';
import type {
  ConversationRow,
  MessageRow,
  PhotoRow,
  ProfileCard,
  PublicProfile,
  ReceivedSignal,
  SentSignal,
} from '@/lib/types';

const PROFILE_COLUMNS =
  'id, user_id, first_name, city, lat, lng, height_cm, nationality, languages, bio, visibility, created_at, age, verification_status, role, online, acceptance_rate';

/**
 * Les photos vivent dans un bucket privé : même approuvées, elles ne sont
 * servies que par URL signée générée côté serveur. Sans clé service_role,
 * l'app retombe sur le dégradé de remplacement des maquettes.
 */
async function signPhotos(paths: string[]): Promise<Map<string, string>> {
  const signed = new Map<string, string>();
  const admin = getAdminSupabase();
  if (!admin || paths.length === 0) return signed;

  const { data } = await admin.storage.from('photos').createSignedUrls(paths, 60 * 30);
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) signed.set(item.path, item.signedUrl);
  }
  return signed;
}

type CardOptions = { viewer?: Session | null };

async function toCards(profiles: PublicProfile[], options: CardOptions): Promise<ProfileCard[]> {
  const supabase = getServerSupabase();
  if (!supabase || profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);

  const [{ data: photos }, { data: links }, favorites] = await Promise.all([
    supabase
      .from('photos')
      .select('profile_id, storage_path, sort_order')
      .in('profile_id', ids)
      .eq('moderation_status', 'approuvee')
      .order('sort_order', { ascending: true }),
    supabase.from('profile_interests').select('profile_id, interest_slug').in('profile_id', ids),
    options.viewer
      ? supabase.from('favorites').select('profile_id').eq('user_id', options.viewer.account.id)
      : Promise.resolve({ data: [] as { profile_id: string }[] }),
  ]);

  const cover = new Map<string, string>();
  for (const photo of photos ?? []) {
    if (!cover.has(photo.profile_id)) cover.set(photo.profile_id, photo.storage_path);
  }
  const signed = await signPhotos([...cover.values()]);

  const interests = new Map<string, string[]>();
  for (const link of links ?? []) {
    interests.set(link.profile_id, [...(interests.get(link.profile_id) ?? []), link.interest_slug]);
  }

  const favoriteIds = new Set((favorites.data ?? []).map((f) => f.profile_id));
  const viewerProfile = options.viewer?.profile ?? null;

  return profiles.map((profile) => ({
    ...profile,
    photoUrl: signed.get(cover.get(profile.id) ?? '') ?? null,
    distanceKm: viewerProfile ? distanceKm(viewerProfile, profile) : null,
    isFavorite: favoriteIds.has(profile.id),
    interests: interests.get(profile.id) ?? [],
  }));
}

export type HomeSections = {
  online: ProfileCard[];
  nearby: ProfileCard[];
  appreciated: ProfileCard[];
  newest: ProfileCard[];
  total: number;
};

/** Accueil connecté — les quatre sections de l'écran 1 des maquettes. */
export async function getHomeSections(): Promise<HomeSections> {
  const supabase = getServerSupabase();
  const session = await getSession();

  if (!supabase || !session) {
    return {
      online: demoProfiles.filter((p) => p.online).slice(0, 8),
      nearby: [...demoProfiles].sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99)).slice(0, 8),
      appreciated: demoProfiles.filter((p) => p.acceptance_rate != null).slice(0, 8),
      newest: [...demoProfiles].reverse().slice(0, 8),
      total: demoProfiles.length,
    };
  }

  const base = supabase.from('profiles_public').select(PROFILE_COLUMNS).eq('visibility', 'visible');
  const audience = session.account.role === 'homme' ? 'femme' : 'homme';

  const [online, newest, all, count] = await Promise.all([
    base.eq('role', audience).eq('online', true).limit(10),
    supabase
      .from('profiles_public')
      .select(PROFILE_COLUMNS)
      .eq('visibility', 'visible')
      .eq('role', audience)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('profiles_public')
      .select(PROFILE_COLUMNS)
      .eq('visibility', 'visible')
      .eq('role', audience)
      .limit(60),
    supabase
      .from('profiles_public')
      .select('id', { count: 'exact', head: true })
      .eq('visibility', 'visible')
      .eq('role', audience),
  ]);

  const everyone = await toCards((all.data ?? []) as PublicProfile[], { viewer: session });

  return {
    online: await toCards((online.data ?? []) as PublicProfile[], { viewer: session }),
    nearby: everyone
      .filter((p) => p.distanceKm != null)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, 10),
    appreciated: everyone
      .filter((p) => p.acceptance_rate != null)
      .sort((a, b) => (b.acceptance_rate ?? 0) - (a.acceptance_rate ?? 0))
      .slice(0, 10),
    newest: await toCards((newest.data ?? []) as PublicProfile[], { viewer: session }),
    total: count.count ?? everyone.length,
  };
}

export type SearchFilters = {
  q?: string;
  city?: string;
  radiusKm?: number;
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  verifiedOnly?: boolean;
  languages?: string[];
  /** Filtre opt-in des deux côtés : sans valeur explicite, aucun profil n'est écarté. */
  nationalities?: string[];
  interests?: string[];
  sort?: 'distance' | 'recent' | 'apprecies';
};

export async function searchProfiles(filters: SearchFilters): Promise<ProfileCard[]> {
  const supabase = getServerSupabase();
  const session = await getSession();

  if (!supabase || !session) {
    return applyDemoFilters(filters);
  }

  const audience = session.account.role === 'homme' ? 'femme' : 'homme';
  let query = supabase
    .from('profiles_public')
    .select(PROFILE_COLUMNS)
    .eq('visibility', 'visible')
    .eq('role', audience)
    .limit(120);

  if (filters.ageMin) query = query.gte('age', filters.ageMin);
  if (filters.ageMax) query = query.lte('age', filters.ageMax);
  if (filters.heightMin) query = query.gte('height_cm', filters.heightMin);
  if (filters.heightMax) query = query.lte('height_cm', filters.heightMax);
  if (filters.verifiedOnly) query = query.eq('verification_status', 'verifie');
  if (filters.city) query = query.ilike('city', `%${filters.city}%`);
  if (filters.languages?.length) query = query.overlaps('languages', filters.languages);
  if (filters.nationalities?.length) query = query.in('nationality', filters.nationalities);
  if (filters.q) query = query.or(`first_name.ilike.%${filters.q}%,city.ilike.%${filters.q}%,bio.ilike.%${filters.q}%`);

  const { data } = await query;
  let cards = await toCards((data ?? []) as PublicProfile[], { viewer: session });

  if (filters.interests?.length) {
    cards = cards.filter((card) => filters.interests!.some((slug) => card.interests.includes(slug)));
  }
  if (filters.radiusKm) {
    cards = cards.filter((card) => card.distanceKm == null || card.distanceKm <= filters.radiusKm!);
  }

  return sortCards(cards, filters.sort);
}

function sortCards(cards: ProfileCard[], sort: SearchFilters['sort']): ProfileCard[] {
  switch (sort) {
    case 'recent':
      return [...cards].sort((a, b) => b.created_at.localeCompare(a.created_at));
    case 'apprecies':
      return [...cards].sort((a, b) => (b.acceptance_rate ?? -1) - (a.acceptance_rate ?? -1));
    default:
      return [...cards].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }
}

function applyDemoFilters(filters: SearchFilters): ProfileCard[] {
  let cards: ProfileCard[] = [...demoProfiles];
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    cards = cards.filter((c) =>
      [c.first_name, c.city, c.bio ?? ''].some((value) => value.toLowerCase().includes(needle)),
    );
  }
  if (filters.city) {
    const needle = filters.city.toLowerCase();
    cards = cards.filter((c) => c.city.toLowerCase().includes(needle));
  }
  if (filters.ageMin) cards = cards.filter((c) => c.age >= filters.ageMin!);
  if (filters.ageMax) cards = cards.filter((c) => c.age <= filters.ageMax!);
  if (filters.heightMin) cards = cards.filter((c) => (c.height_cm ?? 0) >= filters.heightMin!);
  if (filters.heightMax) cards = cards.filter((c) => (c.height_cm ?? 999) <= filters.heightMax!);
  if (filters.verifiedOnly) cards = cards.filter((c) => c.verification_status === 'verifie');
  if (filters.languages?.length) {
    cards = cards.filter((c) => filters.languages!.some((lang) => c.languages.includes(lang)));
  }
  if (filters.interests?.length) {
    cards = cards.filter((c) => filters.interests!.some((slug) => c.interests.includes(slug)));
  }
  if (filters.radiusKm) cards = cards.filter((c) => (c.distanceKm ?? 0) <= filters.radiusKm!);
  return sortCards(cards, filters.sort);
}

export type ProfileDetail = ProfileCard & {
  photos: string[];
  signalStatus: SentSignal['status'] | null;
  isBlocked: boolean;
};

export async function getProfileDetail(profileId: string): Promise<ProfileDetail | null> {
  const supabase = getServerSupabase();
  const session = await getSession();

  if (!supabase || !session) {
    const demo = demoProfiles.find((p) => p.id === profileId);
    return demo ? { ...demo, photos: [], signalStatus: null, isBlocked: false } : null;
  }

  const { data } = await supabase
    .from('profiles_public')
    .select(PROFILE_COLUMNS)
    .eq('id', profileId)
    .maybeSingle<PublicProfile>();
  if (!data) return null;

  const [card] = await toCards([data], { viewer: session });
  if (!card) return null;

  const [{ data: photos }, { data: signal }, { data: block }] = await Promise.all([
    supabase
      .from('photos')
      .select('storage_path, sort_order')
      .eq('profile_id', profileId)
      .eq('moderation_status', 'approuvee')
      .order('sort_order', { ascending: true }),
    supabase
      .from('signals_sent')
      .select('status')
      .eq('receiver_id', data.user_id)
      .maybeSingle<{ status: SentSignal['status'] }>(),
    supabase
      .from('blocks')
      .select('blocked_user_id')
      .eq('user_id', session.account.id)
      .eq('blocked_user_id', data.user_id)
      .maybeSingle(),
  ]);

  const signed = await signPhotos((photos ?? []).map((p) => p.storage_path));

  return {
    ...card,
    photos: (photos ?? []).map((p) => signed.get(p.storage_path)).filter((url): url is string => Boolean(url)),
    signalStatus: signal?.status ?? null,
    isBlocked: Boolean(block),
  };
}

/** « Ma sélection » — signes envoyés (un refus reste affiché « en attente »). */
export async function getSelection(): Promise<{ card: ProfileCard; signal: SentSignal }[]> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return [];

  const { data: signals } = await supabase
    .from('signals_sent')
    .select('id, receiver_id, status, created_at, expires_at')
    .order('created_at', { ascending: false })
    .returns<SentSignal[]>();
  if (!signals?.length) return [];

  const { data: profiles } = await supabase
    .from('profiles_public')
    .select(PROFILE_COLUMNS)
    .in('user_id', signals.map((s) => s.receiver_id));

  const cards = await toCards((profiles ?? []) as PublicProfile[], { viewer: session });
  const byUser = new Map(cards.map((card) => [card.user_id, card]));

  return signals
    .map((signal) => ({ signal, card: byUser.get(signal.receiver_id) }))
    .filter((row): row is { card: ProfileCard; signal: SentSignal } => Boolean(row.card));
}

/** Dashboard femme — signes reçus en attente de décision. */
export async function getReceivedSignals(): Promise<{ card: ProfileCard | null; signal: ReceivedSignal }[]> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return [];

  const { data: signals } = await supabase
    .from('signals')
    .select('id, sender_id, status, created_at')
    .eq('receiver_id', session.account.id)
    .eq('status', 'envoye')
    .order('created_at', { ascending: false })
    .returns<ReceivedSignal[]>();
  if (!signals?.length) return [];

  const { data: profiles } = await supabase
    .from('profiles_public')
    .select(PROFILE_COLUMNS)
    .in('user_id', signals.map((s) => s.sender_id));

  const cards = await toCards((profiles ?? []) as PublicProfile[], { viewer: session });
  const byUser = new Map(cards.map((card) => [card.user_id, card]));

  return signals.map((signal) => ({ signal, card: byUser.get(signal.sender_id) ?? null }));
}

export type ConversationSummary = {
  conversation: ConversationRow;
  otherUserId: string;
  card: ProfileCard | null;
  lastMessage: string | null;
  unread: number;
};

export async function getConversations(): Promise<ConversationSummary[]> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return [];

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .returns<ConversationRow[]>();
  if (!conversations?.length) return [];

  const me = session.account.id;
  const others = conversations.map((c) => (c.participant_a === me ? c.participant_b : c.participant_a));

  const [{ data: profiles }, { data: messages }] = await Promise.all([
    supabase.from('profiles_public').select(PROFILE_COLUMNS).in('user_id', others),
    supabase
      .from('messages')
      .select('conversation_id, body, sender_id, read_at, created_at')
      .in('conversation_id', conversations.map((c) => c.id))
      .order('created_at', { ascending: false }),
  ]);

  const cards = await toCards((profiles ?? []) as PublicProfile[], { viewer: session });
  const byUser = new Map(cards.map((card) => [card.user_id, card]));

  return conversations.map((conversation) => {
    const otherUserId = conversation.participant_a === me ? conversation.participant_b : conversation.participant_a;
    const thread = (messages ?? []).filter((m) => m.conversation_id === conversation.id);
    return {
      conversation,
      otherUserId,
      card: byUser.get(otherUserId) ?? null,
      lastMessage: thread[0]?.body ?? null,
      unread: thread.filter((m) => m.sender_id !== me && !m.read_at).length,
    };
  });
}

export async function getConversation(conversationId: string): Promise<{
  conversation: ConversationRow;
  card: ProfileCard | null;
  messages: MessageRow[];
} | null> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return null;

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle<ConversationRow>();
  if (!conversation) return null;

  const me = session.account.id;
  const otherUserId = conversation.participant_a === me ? conversation.participant_b : conversation.participant_a;

  const [{ data: profile }, { data: messages }] = await Promise.all([
    supabase.from('profiles_public').select(PROFILE_COLUMNS).eq('user_id', otherUserId).maybeSingle<PublicProfile>(),
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .returns<MessageRow[]>(),
  ]);

  const [card] = profile ? await toCards([profile], { viewer: session }) : [];

  return { conversation, card: card ?? null, messages: messages ?? [] };
}

export async function getFavorites(): Promise<ProfileCard[]> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return [];

  const { data: favorites } = await supabase
    .from('favorites')
    .select('profile_id')
    .eq('user_id', session.account.id);
  if (!favorites?.length) return [];

  const { data: profiles } = await supabase
    .from('profiles_public')
    .select(PROFILE_COLUMNS)
    .in('id', favorites.map((f) => f.profile_id));

  return toCards((profiles ?? []) as PublicProfile[], { viewer: session });
}

/** File de modération des photos (revue humaine, section 5). */
export async function getModerationQueue(): Promise<
  { photo: PhotoRow; profileName: string; url: string | null }[]
> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session?.account.is_moderator) return [];

  const { data: photos } = await supabase
    .from('photos')
    .select('*, profiles(first_name)')
    .eq('moderation_status', 'en_attente')
    .order('created_at', { ascending: true })
    .limit(50);
  if (!photos?.length) return [];

  const signed = await signPhotos(photos.map((p) => p.storage_path as string));

  return photos.map((photo) => ({
    photo: photo as unknown as PhotoRow,
    profileName: (photo as { profiles?: { first_name?: string } }).profiles?.first_name ?? 'Profil',
    url: signed.get(photo.storage_path as string) ?? null,
  }));
}

export async function getOpenReports() {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session?.account.is_moderator) return [];

  const { data } = await supabase
    .from('reports')
    .select('*')
    .in('status', ['nouveau', 'en_cours'])
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}
