import { cache } from 'react';
import { getServerSupabase } from '@/lib/supabase/server';
import type { AccountRow, ProfileRow } from '@/lib/types';

export type Session = {
  account: AccountRow;
  profile: ProfileRow | null;
};

/**
 * Compte connecté + son profil. `cache` évite de refaire la requête à chaque
 * composant serveur d'une même page.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: account } = await supabase
    .from('users')
    .select('*')
    .eq('id', auth.user.id)
    .maybeSingle<AccountRow>();

  if (!account) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle<ProfileRow>();

  return { account, profile: profile ?? null };
});

/** Un compte peut consulter les profils s'il est majeur et a accepté les CGU. */
export function canBrowse(session: Session | null): boolean {
  if (!session) return false;
  const { account } = session;
  return Boolean(account.cgu_accepted_at) && !account.deletion_scheduled_at && isAdult(account.birth_date);
}

export function isAdult(birthDate: string): boolean {
  const birth = new Date(birthDate);
  const majority = new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate());
  return majority <= new Date();
}

export function ageFromBirthDate(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const before =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (before) age -= 1;
  return age;
}
