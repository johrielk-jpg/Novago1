/**
 * Accès centralisé à la configuration. Aucune valeur secrète n'est lue depuis
 * un composant client : tout ce qui n'est pas préfixé NEXT_PUBLIC_ ne doit
 * être importé que depuis du code serveur.
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  identityProvider: (process.env.IDENTITY_PROVIDER ?? 'mock') as 'mock' | 'veriff' | 'onfido' | 'idnow',
  identityApiKey: process.env.IDENTITY_API_KEY ?? '',
  identityWebhookSecret: process.env.IDENTITY_WEBHOOK_SECRET ?? '',
  moderationProvider: (process.env.MODERATION_PROVIDER ?? 'mock') as 'mock' | 'sightengine' | 'rekognition',
  sightengineUser: process.env.SIGHTENGINE_USER ?? '',
  sightengineSecret: process.env.SIGHTENGINE_SECRET ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
};

/**
 * Sans projet Supabase configuré, l'app tourne en « mode démo » : les écrans
 * publics s'affichent avec des profils fictifs et toute écriture est refusée.
 */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
