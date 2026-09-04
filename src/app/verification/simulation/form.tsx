'use client';

import { useFormState } from 'react-dom';
import { simulerDecision } from '@/app/actions/verification';
import { FormFeedback, SubmitButton } from '@/components/form';

export function SimulationForm({ sessionId }: { sessionId: string }) {
  const [state, formAction] = useFormState(simulerDecision, {});

  return (
    <form action={formAction} className="flex gap-2.5">
      <input type="hidden" name="session" value={sessionId} />
      <button type="submit" name="decision" value="rejete" className="btn-ghost flex-1">
        Refuser
      </button>
      <SubmitButton className="btn-primary flex-1" name="decision" value="verifie">
        Valider
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
