export type UserRole = 'homme' | 'femme';
export type VerificationStatus = 'non_verifie' | 'en_cours' | 'verifie' | 'rejete';
export type ModerationStatus = 'en_attente' | 'approuvee' | 'rejetee';
export type SignalStatus = 'envoye' | 'accepte' | 'refuse' | 'expire';
export type ProfileVisibility = 'brouillon' | 'en_attente_moderation' | 'visible' | 'masque';
export type ReportStatus = 'nouveau' | 'en_cours' | 'traite' | 'rejete';

export type AccountRow = {
  id: string;
  email: string;
  role: UserRole;
  birth_date: string;
  verification_status: VerificationStatus;
  is_moderator: boolean;
  cgu_accepted_at: string | null;
  last_seen_at: string | null;
  deletion_scheduled_at: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  user_id: string;
  first_name: string;
  city: string;
  lat: number | null;
  lng: number | null;
  height_cm: number | null;
  nationality: string | null;
  nationality_visible: boolean;
  languages: string[];
  bio: string | null;
  visibility: ProfileVisibility;
  verified_only: boolean;
  max_distance_km: number | null;
  created_at: string;
  updated_at: string;
};

/** Vue public.profiles_public : nationalité déjà masquée si non opt-in. */
export type PublicProfile = {
  id: string;
  user_id: string;
  first_name: string;
  city: string;
  lat: number | null;
  lng: number | null;
  height_cm: number | null;
  nationality: string | null;
  languages: string[];
  bio: string | null;
  visibility: ProfileVisibility;
  created_at: string;
  age: number;
  verification_status: VerificationStatus;
  role: UserRole;
  online: boolean;
  acceptance_rate: number | null;
};

export type PhotoRow = {
  id: string;
  profile_id: string;
  storage_path: string;
  sort_order: number;
  moderation_status: ModerationStatus;
  moderation_scores: Record<string, unknown> | null;
  created_at: string;
};

export type ProfileCard = PublicProfile & {
  photoUrl: string | null;
  distanceKm: number | null;
  isFavorite: boolean;
  interests: string[];
};

export type SentSignal = {
  id: string;
  receiver_id: string;
  status: Exclude<SignalStatus, 'refuse'>;
  created_at: string;
  expires_at: string;
};

export type ReceivedSignal = {
  id: string;
  sender_id: string;
  status: SignalStatus;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  signal_id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
  last_message_at: string | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};
