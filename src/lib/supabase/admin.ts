import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Client service_role : contourne RLS. Réservé aux webhooks du prestataire de
 * vérification, au pré-filtre de modération et aux tâches planifiées.
 * Ne jamais l'importer depuis un composant client.
 */
export function getAdminSupabase() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
