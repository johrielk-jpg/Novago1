'use client';

import { useFormState } from 'react-dom';
import { repondreSigne } from '@/app/actions/signals';

/**
 * Accepter / refuser. Le refus n'envoie rien à l'expéditeur : côté base, sa
 * ligne reste affichée « en attente » jusqu'à l'expiration (section 4.2).
 */
export function SignalDecision({ signalId }: { signalId: string }) {
  const [, formAction] = useFormState(repondreSigne, {});

  return (
    <form action={formAction} className="flex gap-1.5">
      <input type="hidden" name="signalId" value={signalId} />
      <button
        type="submit"
        name="decision"
        value="refuse"
        aria-label="Refuser ce signe"
        className="h-8 w-8 rounded-full bg-paper-2 text-[13px] text-grey"
      >
        ✕
      </button>
      <button
        type="submit"
        name="decision"
        value="accepte"
        aria-label="Accepter ce signe"
        className="h-8 w-8 rounded-full bg-sage text-[13px] text-white"
      >
        ✓
      </button>
    </form>
  );
}
