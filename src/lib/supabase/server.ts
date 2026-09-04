import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { env, isSupabaseConfigured } from '@/lib/env';

/**
 * Client Supabase lié à la session de l'utilisateur (clé anon + cookies).
 * Toutes les policies RLS de supabase/migrations/0002_rls.sql s'appliquent.
 * Retourne null en mode démo (pas de projet Supabase configuré).
 */
export function getServerSupabase() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Appelé depuis un Server Component : le refresh de session est
          // assuré par le middleware, on peut ignorer.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          /* idem */
        }
      },
    },
  });
}
