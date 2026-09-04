'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import type { ActionState } from '@/app/actions/auth';

/** Revue humaine des photos — écran /moderation, réservé aux modérateurs. */
export async function trancherPhoto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const photoId = String(formData.get('photoId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  if (decision !== 'approuvee' && decision !== 'rejetee') return { error: 'Décision invalide.' };

  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session?.account.is_moderator) return { error: 'Accès réservé à la modération.' };

  const { error } = await supabase
    .from('photos')
    .update({
      moderation_status: decision,
      moderated_at: new Date().toISOString(),
      moderated_by: session.account.id,
    })
    .eq('id', photoId);
  if (error) return { error: error.message };

  revalidatePath('/moderation');
  return { success: decision === 'approuvee' ? 'Photo publiée.' : 'Photo rejetée.' };
}

/** Mise en ligne d'un profil après revue (aucune publication automatique). */
export async function publierApresRevue(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = String(formData.get('profileId') ?? '');
  const decision = String(formData.get('decision') ?? '');

  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session?.account.is_moderator) return { error: 'Accès réservé à la modération.' };

  const { error } = await supabase
    .from('profiles')
    .update({ visibility: decision === 'approuve' ? 'visible' : 'brouillon' })
    .eq('id', profileId);
  if (error) return { error: error.message };

  revalidatePath('/moderation');
  return { success: decision === 'approuve' ? 'Profil en ligne.' : 'Profil renvoyé en brouillon.' };
}

export async function traiterSignalement(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const reportId = String(formData.get('reportId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!['en_cours', 'traite', 'rejete'].includes(status)) return { error: 'Statut invalide.' };

  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session?.account.is_moderator) return { error: 'Accès réservé à la modération.' };

  const { error } = await supabase
    .from('reports')
    .update({ status, handled_at: new Date().toISOString(), handled_by: session.account.id })
    .eq('id', reportId);
  if (error) return { error: error.message };

  revalidatePath('/moderation');
  return { success: 'Signalement mis à jour.' };
}
