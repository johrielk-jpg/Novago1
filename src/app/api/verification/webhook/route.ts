import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getIdentityProvider } from '@/lib/identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook du prestataire de vérification d'identité.
 * La signature est vérifiée AVANT toute écriture : c'est ce webhook qui fait
 * passer un compte en « vérifié », donc le seul endroit où le statut change.
 */
export async function POST(request: Request) {
  const provider = getIdentityProvider();
  const rawBody = await request.text();
  const signature =
    request.headers.get('x-hmac-signature') ?? request.headers.get('x-signature') ?? null;

  if (!provider.verifyWebhook(rawBody, signature)) {
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Corps illisible.' }, { status: 400 });
  }

  const decision = provider.parseDecision(payload);
  if (!decision) return NextResponse.json({ error: 'Décision absente.' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });

  const { data: verification } = await admin
    .from('identity_verifications')
    .update({ status: decision.status, decided_at: new Date().toISOString() })
    .eq('provider', provider.name)
    .eq('provider_session_id', decision.sessionId)
    .select('user_id')
    .maybeSingle<{ user_id: string }>();

  if (!verification) return NextResponse.json({ error: 'Session inconnue.' }, { status: 404 });

  await admin
    .from('users')
    .update({ verification_status: decision.status })
    .eq('id', verification.user_id);

  return NextResponse.json({ ok: true });
}
