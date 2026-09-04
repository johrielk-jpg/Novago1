'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import type { ActionState } from '@/app/actions/auth';

/**
 * Envoi d'un signe. La logique vit dans la fonction SQL send_signal() :
 * elle reste silencieuse si le destinataire a déjà refusé, pour qu'aucune
 * différence de comportement ne trahisse le refus (section 4.2).
 */
export async function envoyerSigne(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const targetUserId = String(formData.get('targetUserId') ?? '');
  const supabase = getServerSupabase();
  if (!supabase) return { error: 'Mode démo : aucun projet Supabase configuré.' };

  const { error } = await supabase.rpc('send_signal', { target: targetUserId });
  if (error) return { error: error.message };

  revalidatePath('/selection');
  revalidatePath('/profil/[id]', 'page');
  return { success: 'Signe envoyé. La conversation s’ouvrira si elle répond.' };
}

/**
 * Réponse à un signe. Accepter ouvre la conversation (trigger SQL).
 * Refuser est définitif ET silencieux : aucune notification, aucun e-mail.
 */
export async function repondreSigne(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const signalId = String(formData.get('signalId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  if (decision !== 'accepte' && decision !== 'refuse') return { error: 'Décision invalide.' };

  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return { error: 'Session expirée.' };

  const { error } = await supabase
    .from('signals')
    .update({ status: decision, responded_at: new Date().toISOString() })
    .eq('id', signalId)
    .eq('receiver_id', session.account.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard-femme');
  revalidatePath('/messages');
  return {
    success:
      decision === 'accepte'
        ? 'Signe accepté, la conversation est ouverte.'
        : 'Signe refusé. Aucun message n’est envoyé à l’expéditeur.',
  };
}
