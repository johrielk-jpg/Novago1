'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import type { ActionState } from '@/app/actions/auth';

export async function basculerFavori(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = String(formData.get('profileId') ?? '');
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return { error: 'Connexion requise.' };

  const { data: existing } = await supabase
    .from('favorites')
    .select('profile_id')
    .eq('user_id', session.account.id)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (existing) {
    await supabase.from('favorites').delete().eq('user_id', session.account.id).eq('profile_id', profileId);
  } else {
    await supabase.from('favorites').insert({ user_id: session.account.id, profile_id: profileId });
  }

  revalidatePath('/');
  revalidatePath('/recherche');
  revalidatePath(`/profil/${profileId}`);
  return { success: existing ? 'Retiré des favoris.' : 'Ajouté aux favoris.' };
}

const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1, 'Message vide').max(4000),
});

export async function envoyerMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Message invalide.' };

  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return { error: 'Connexion requise.' };

  const { error } = await supabase.from('messages').insert({
    conversation_id: parsed.data.conversationId,
    sender_id: session.account.id,
    body: parsed.data.body,
  });
  if (error) return { error: error.message };

  revalidatePath(`/messages/${parsed.data.conversationId}`);
  return {};
}

const reportSchema = z.object({
  reportedUserId: z.string().uuid(),
  reason: z.enum(['photos', 'harcelement', 'faux_profil', 'arnaque', 'autre']),
  details: z.string().trim().max(2000).optional(),
});

export async function signaler(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Signalement incomplet.' };

  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return { error: 'Connexion requise.' };

  const { error } = await supabase.from('reports').insert({
    reporter_id: session.account.id,
    reported_user_id: parsed.data.reportedUserId,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });
  if (error) return { error: error.message };

  return { success: 'Signalement transmis à la modération.' };
}

export async function bloquer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const blockedUserId = String(formData.get('blockedUserId') ?? '');
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return { error: 'Connexion requise.' };

  const { error } = await supabase
    .from('blocks')
    .insert({ user_id: session.account.id, blocked_user_id: blockedUserId });
  if (error && error.code !== '23505') return { error: error.message };

  revalidatePath('/compte/bloques');
  revalidatePath('/recherche');
  return { success: 'Compte bloqué. Vous n’apparaissez plus l’un pour l’autre.' };
}

export async function debloquer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const blockedUserId = String(formData.get('blockedUserId') ?? '');
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return { error: 'Connexion requise.' };

  await supabase
    .from('blocks')
    .delete()
    .eq('user_id', session.account.id)
    .eq('blocked_user_id', blockedUserId);

  revalidatePath('/compte/bloques');
  return { success: 'Compte débloqué.' };
}
