'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase/server';
import { isAdult } from '@/lib/session';

export type ActionState = { error?: string; success?: string };

const inscriptionSchema = z.object({
  firstName: z.string().trim().min(2, 'Prénom trop court').max(40),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance invalide'),
  city: z.string().trim().min(2, 'Ville requise'),
  email: z.string().trim().email('E-mail invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  role: z.enum(['homme', 'femme']),
  cgu: z.literal('on', { errorMap: () => ({ message: 'Vous devez accepter les CGU.' }) }),
});

export async function inscription(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = inscriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire incomplet' };

  const { firstName, birthDate, city, email, password, role } = parsed.data;

  // Contrôle 18+ côté serveur, en plus du trigger SQL (section 5).
  if (!isAdult(birthDate)) {
    return { error: 'Meet X est réservé aux personnes majeures (18 ans révolus).' };
  }

  const supabase = getServerSupabase();
  if (!supabase) return { error: 'Mode démo : aucun projet Supabase configuré.' };

  const { data: signUp, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError || !signUp.user) {
    return { error: signUpError?.message ?? 'Inscription impossible.' };
  }

  const { error: accountError } = await supabase.from('users').insert({
    id: signUp.user.id,
    email,
    role,
    birth_date: birthDate,
    cgu_accepted_at: new Date().toISOString(),
  });
  if (accountError) return { error: accountError.message };

  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: signUp.user.id,
    first_name: firstName,
    city,
    visibility: 'brouillon',
  });
  if (profileError) return { error: profileError.message };

  revalidatePath('/', 'layout');
  redirect(role === 'femme' ? '/verification' : '/recherche');
}

export async function connexion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('suite') ?? '') || '/';

  const supabase = getServerSupabase();
  if (!supabase) return { error: 'Mode démo : aucun projet Supabase configuré.' };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'E-mail ou mot de passe incorrect.' };

  await supabase.from('users').update({ last_seen_at: new Date().toISOString() }).eq('email', email);

  revalidatePath('/', 'layout');
  redirect(next.startsWith('/') ? next : '/');
}

export async function deconnexion() {
  const supabase = getServerSupabase();
  await supabase?.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
