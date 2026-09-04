import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Repli si pg_cron n'est pas activé sur le projet Supabase : à appeler depuis
 * une Scheduled Function Netlify avec l'en-tête `x-cron-secret`.
 * Expire les signes de plus de 14 jours et applique les purges RGPD.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('x-cron-secret') !== secret) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });

  const [signals, identity, accounts] = await Promise.all([
    admin.rpc('expire_stale_signals'),
    admin.rpc('purge_identity_verifications'),
    admin.rpc('purge_deleted_accounts'),
  ]);

  return NextResponse.json({
    signesExpires: signals.data ?? 0,
    verificationsPurgees: identity.data ?? 0,
    comptesSupprimes: accounts.data ?? 0,
  });
}
