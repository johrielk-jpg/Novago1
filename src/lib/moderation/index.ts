import { env } from '@/lib/env';
import type { ModerationStatus } from '@/lib/types';

/**
 * Modération photo — section 5 : pré-filtre automatique PUIS revue humaine.
 * Le pré-filtre ne peut que REJETER. Il n'approuve jamais tout seul : une
 * photo « propre » repart en file d'attente humaine (`en_attente`).
 */

export type ScreeningResult = {
  status: Extract<ModerationStatus, 'en_attente' | 'rejetee'>;
  scores: Record<string, number>;
  reason?: string;
};

export interface ModerationProvider {
  readonly name: string;
  screen(image: { bytes: ArrayBuffer; contentType: string }): Promise<ScreeningResult>;
}

const mockModeration: ModerationProvider = {
  name: 'mock',
  async screen() {
    return { status: 'en_attente', scores: {} };
  },
};

/**
 * Sightengine — modèles nudity/offensive/gore. Seuils volontairement bas :
 * en cas de doute la photo part quand même en revue humaine.
 */
const sightengine: ModerationProvider = {
  name: 'sightengine',
  async screen({ bytes, contentType }) {
    if (!env.sightengineUser || !env.sightengineSecret) {
      throw new Error('SIGHTENGINE_USER / SIGHTENGINE_SECRET manquants.');
    }
    const form = new FormData();
    form.append('media', new Blob([bytes], { type: contentType }), 'photo');
    form.append('models', 'nudity-2.1,offensive,gore,face-attributes');
    form.append('api_user', env.sightengineUser);
    form.append('api_secret', env.sightengineSecret);

    const response = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: form,
    });
    if (!response.ok) throw new Error(`Sightengine: ${response.status}`);
    const data = (await response.json()) as {
      nudity?: { sexual_activity?: number; sexual_display?: number; erotica?: number };
      offensive?: { prob?: number };
      gore?: { prob?: number };
    };

    const scores = {
      sexual_activity: data.nudity?.sexual_activity ?? 0,
      sexual_display: data.nudity?.sexual_display ?? 0,
      erotica: data.nudity?.erotica ?? 0,
      offensive: data.offensive?.prob ?? 0,
      gore: data.gore?.prob ?? 0,
    };

    const blocking = Object.entries(scores).find(([, value]) => value > 0.5);
    if (blocking) {
      return { status: 'rejetee', scores, reason: `Pré-filtre : ${blocking[0]}` };
    }
    return { status: 'en_attente', scores };
  },
};

export function getModerationProvider(): ModerationProvider {
  switch (env.moderationProvider) {
    case 'sightengine':
      return sightengine;
    case 'rekognition':
      throw new Error('Adaptateur AWS Rekognition non implémenté (prestataire non tranché).');
    default:
      return mockModeration;
  }
}
