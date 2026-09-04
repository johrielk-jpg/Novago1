'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getSession } from '@/lib/session';
import { getIdentityProvider } from '@/lib/identity';
import type { ActionState } from '@/app/actions/auth';

/**
 * Démarre une session chez le prestataire de vérification d'identité et
 * redirige le membre vers son parcours. Aucune pièce d'identité ne transite
 * ni ne se stocke chez nous : on ne garde que la référence de session.
 */
export async function demarrerVerification(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const supabase = getServerSupabase();
  const session = await getSession();
  if (!supabase || !session) return { error: 'Connexion requise.' };

  const provider = getIdentityProvider();

  let created;
  try {
    created = await provider.createSession({
      userId: session.account.id,
      email: session.account.email,
      firstName: session.profile?.first_name ?? '',
    });
  } catch (error) {
    return { error: (error as Error).message };
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY manquante : impossible d’enregistrer la vérification.' };
  }

  await admin.from('identity_verifications').insert({
    user_id: session.account.id,
    provider: created.provider,
    provider_session_id: created.sessionId,
    status: 'en_cours',
  });
  await admin.from('users').update({ verification_status: 'en_cours' }).eq('id', session.account.id);

  revalidatePath('/verification');
  redirect(created.redirectUrl);
}

/**
 * Décision simulée — uniquement disponible avec IDENTITY_PROVIDER=mock, pour
 * pouvoir dérouler le parcours tant que le prestataire n'est pas tranché.
 */
export async function simulerDecision(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (process.env.IDENTITY_PROVIDER && process.env.IDENTITY_PROVIDER !== 'mock') {
    return { error: 'Simulation désactivée : un prestataire réel est configuré.' };
  }
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Simulation indisponible en production.' };
  }

  const sessionId = String(formData.get('session') ?? '');
  const decision = String(formData.get('decision') ?? 'verifie');
  const admin = getAdminSupabase();
  const session = await getSession();
  if (!admin || !session) return { error: 'Connexion requise.' };

  const status = decision === 'verifie' ? 'verifie' : 'rejete';

  await admin
    .from('identity_verifications')
    .update({ status, decided_at: new Date().toISOString() })
    .eq('provider_session_id', sessionId)
    .eq('user_id', session.account.id);
  await admin.from('users').update({ verification_status: status }).eq('id', session.account.id);

  revalidatePath('/verification');
  redirect('/verification?resultat=' + status);
}
