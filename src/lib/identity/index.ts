import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import type { VerificationStatus } from '@/lib/types';

/**
 * Vérification d'identité — section 5 du brief : la comparaison « maison »
 * d'un selfie n'est pas défendable, on passe par un prestataire spécialisé.
 * L'adaptateur ci-dessous isole le choix (Veriff / Onfido / IDnow) pour que
 * le reste de l'app n'en dépende pas.
 *
 * Tant qu'aucun prestataire n'est retenu (point 7 du brief), IDENTITY_PROVIDER
 * reste sur `mock` : le parcours est complet mais la décision est simulée et
 * aucun profil ne peut passer « vérifié » en production avec ce réglage.
 */

export type IdentitySession = {
  provider: string;
  sessionId: string;
  /** URL vers laquelle rediriger le membre pour faire sa vérification. */
  redirectUrl: string;
};

export type IdentityDecision = {
  sessionId: string;
  status: VerificationStatus;
};

export interface IdentityProvider {
  readonly name: string;
  readonly isProduction: boolean;
  createSession(input: { userId: string; email: string; firstName: string }): Promise<IdentitySession>;
  /** Vérifie la signature du webhook avant toute écriture en base. */
  verifyWebhook(rawBody: string, signature: string | null): boolean;
  parseDecision(payload: unknown): IdentityDecision | null;
}

const mockProvider: IdentityProvider = {
  name: 'mock',
  isProduction: false,
  async createSession({ userId }) {
    const sessionId = `mock_${userId.slice(0, 8)}_${Date.now().toString(36)}`;
    return {
      provider: 'mock',
      sessionId,
      redirectUrl: `/verification/simulation?session=${encodeURIComponent(sessionId)}`,
    };
  },
  verifyWebhook() {
    // Le webhook mock n'est accepté qu'en développement, cf. route.ts.
    return process.env.NODE_ENV !== 'production';
  },
  parseDecision(payload) {
    const body = payload as { sessionId?: string; status?: string };
    if (!body?.sessionId) return null;
    const status: VerificationStatus = body.status === 'verifie' ? 'verifie' : 'rejete';
    return { sessionId: body.sessionId, status };
  },
};

/**
 * Squelette Veriff — la forme des appels est celle documentée par Veriff, mais
 * elle n'a pas été exécutée contre l'API réelle : à valider avec les clés du
 * compte le jour où le prestataire est choisi.
 */
const veriffProvider: IdentityProvider = {
  name: 'veriff',
  isProduction: true,
  async createSession({ userId, firstName }) {
    if (!env.identityApiKey) throw new Error('IDENTITY_API_KEY manquante pour Veriff.');
    const response = await fetch('https://stationapi.veriff.com/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-AUTH-CLIENT': env.identityApiKey },
      body: JSON.stringify({
        verification: {
          callback: `${env.siteUrl}/verification/retour`,
          person: { firstName },
          vendorData: userId,
        },
      }),
    });
    if (!response.ok) throw new Error(`Veriff: création de session refusée (${response.status})`);
    const data = (await response.json()) as { verification: { id: string; url: string } };
    return { provider: 'veriff', sessionId: data.verification.id, redirectUrl: data.verification.url };
  },
  verifyWebhook(rawBody, signature) {
    if (!signature || !env.identityWebhookSecret) return false;
    // HMAC-SHA256 du corps brut, comparé en temps constant.
    const expected = createHmac('sha256', env.identityWebhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  },
  parseDecision(payload) {
    const body = payload as { verification?: { id?: string; status?: string } };
    const id = body?.verification?.id;
    if (!id) return null;
    const approved = body.verification?.status === 'approved';
    return { sessionId: id, status: approved ? 'verifie' : 'rejete' };
  },
};

export function getIdentityProvider(): IdentityProvider {
  switch (env.identityProvider) {
    case 'veriff':
      return veriffProvider;
    case 'onfido':
    case 'idnow':
      throw new Error(
        `Adaptateur « ${env.identityProvider} » non implémenté : le prestataire n'est pas encore tranché (point 7 du brief).`,
      );
    default:
      return mockProvider;
  }
}
