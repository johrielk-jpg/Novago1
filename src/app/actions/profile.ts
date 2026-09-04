'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import { getModerationProvider } from '@/lib/moderation';
import type { ActionState } from '@/app/actions/auth';

const profileSchema = z.object({
  firstName: z.string().trim().min(2).max(40),
  city: z.string().trim().min(2),
  bio: z.string().trim().max(1000).optional(),
  heightCm: z.coerce.number().int().min(120).max(230).optional(),
  nationality: z.string().trim().max(60).optional(),
  nationalityVisible: z.union([z.literal('on'), z.undefined()]),
  languages: z.string().optional(),
  interests: z.string().optional(),
});

export async function enregistrerProfil(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Profil incomplet.' };

  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session?.profile) return { error: 'Connexion requise.' };

  const values = parsed.data;
  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: values.firstName,
      city: values.city,
      bio: values.bio || null,
      height_cm: values.heightCm ?? null,
      // Donnée sensible : stockée seulement si renseignée, masquée par défaut.
      nationality: values.nationality || null,
      nationality_visible: values.nationalityVisible === 'on',
      languages: values.languages ? values.languages.split(',').map((l) => l.trim()).filter(Boolean) : [],
    })
    .eq('user_id', session.account.id);
  if (error) return { error: error.message };

  const slugs = (values.interests ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  await supabase.from('profile_interests').delete().eq('profile_id', session.profile.id);
  if (slugs.length) {
    await supabase
      .from('profile_interests')
      .insert(slugs.map((slug) => ({ profile_id: session.profile!.id, interest_slug: slug })));
  }

  revalidatePath('/profil/moi');
  return { success: 'Profil enregistré.' };
}

/**
 * « Publier mon profil » ⇒ file de modération, jamais mise en ligne directe
 * (section 5). Un profil femme non vérifié est refusé côté SQL.
 */
export async function publierProfil(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session?.profile) return { error: 'Connexion requise.' };

  if (session.account.role === 'femme' && session.account.verification_status !== 'verifie') {
    return { error: 'Vérification d’identité requise avant publication (étape 3 de l’inscription).' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ visibility: 'en_attente_moderation' })
    .eq('user_id', session.account.id);
  if (error) return { error: error.message };

  revalidatePath('/profil/moi');
  return { success: 'Profil envoyé en modération. Il sera en ligne après revue.' };
}

export async function majVisibilite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session?.profile) return { error: 'Connexion requise.' };

  const visible = formData.get('visible') === 'on';
  const verifiedOnly = formData.get('verifiedOnly') === 'on';
  const maxDistance = formData.get('maxDistanceKm');

  const current = session.profile.visibility;
  // On ne remet « visible » que si le profil est déjà passé par la modération.
  const nextVisibility = visible
    ? current === 'masque'
      ? 'visible'
      : current
    : current === 'visible'
      ? 'masque'
      : current;

  const { error } = await supabase
    .from('profiles')
    .update({
      visibility: nextVisibility,
      verified_only: verifiedOnly,
      max_distance_km: maxDistance ? Number(maxDistance) : null,
    })
    .eq('user_id', session.account.id);
  if (error) return { error: error.message };

  revalidatePath('/dashboard-femme');
  return { success: 'Préférences de visibilité mises à jour.' };
}

/**
 * Upload d'une photo : pré-filtre automatique puis file de revue humaine.
 * Aucune photo n'est visible publiquement avant approbation manuelle.
 */
export async function ajouterPhoto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get('photo');
  if (!(file instanceof File) || file.size === 0) return { error: 'Aucun fichier sélectionné.' };
  if (file.size > 8 * 1024 * 1024) return { error: 'Photo trop lourde (8 Mo maximum).' };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'Format accepté : JPEG, PNG ou WebP.' };
  }

  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session?.profile) return { error: 'Connexion requise.' };

  const { count } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', session.profile.id);
  if ((count ?? 0) >= 6) return { error: 'Six photos maximum.' };

  const bytes = await file.arrayBuffer();

  let screening: Awaited<ReturnType<ReturnType<typeof getModerationProvider>['screen']>>;
  try {
    screening = await getModerationProvider().screen({ bytes, contentType: file.type });
  } catch (error) {
    // Pré-filtre indisponible : on n'accepte pas la photo « par défaut ».
    return {
      error: `Modération automatique indisponible, photo non enregistrée. (${(error as Error).message})`,
    };
  }

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${session.account.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from('photos').insert({
    profile_id: session.profile.id,
    storage_path: path,
    sort_order: count ?? 0,
    moderation_status: screening.status,
    moderation_scores: screening.scores,
  });
  if (insertError) return { error: insertError.message };

  revalidatePath('/profil/moi');
  return {
    success:
      screening.status === 'rejetee'
        ? `Photo refusée par le pré-filtre automatique (${screening.reason ?? 'contenu non conforme'}).`
        : 'Photo reçue. Elle sera visible après revue de la modération.',
  };
}

export async function supprimerPhoto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const photoId = String(formData.get('photoId') ?? '');
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session?.profile) return { error: 'Connexion requise.' };

  const { data: photo } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('id', photoId)
    .eq('profile_id', session.profile.id)
    .maybeSingle<{ storage_path: string }>();
  if (!photo) return { error: 'Photo introuvable.' };

  await supabase.storage.from('photos').remove([photo.storage_path]);
  await supabase.from('photos').delete().eq('id', photoId);

  revalidatePath('/profil/moi');
  return { success: 'Photo supprimée.' };
}

/** RGPD — suppression différée de 30 jours, annulable. */
export async function programmerSuppression(): Promise<void> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return;

  const date = new Date();
  date.setDate(date.getDate() + 30);

  await supabase
    .from('users')
    .update({ deletion_scheduled_at: date.toISOString() })
    .eq('id', session.account.id);
  await supabase.from('profiles').update({ visibility: 'masque' }).eq('user_id', session.account.id);
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/?suppression=programmee');
}

export async function annulerSuppression(): Promise<void> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return;

  await supabase.from('users').update({ deletion_scheduled_at: null }).eq('id', session.account.id);
  revalidatePath('/compte');
}
