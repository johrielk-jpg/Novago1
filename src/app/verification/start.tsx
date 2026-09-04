'use client';

import { useFormState } from 'react-dom';
import { demarrerVerification } from '@/app/actions/verification';
import { FormFeedback, SubmitButton } from '@/components/form';

export function StartVerification() {
  const [state, formAction] = useFormState(demarrerVerification, {});

  return (
    <form action={formAction} className="mt-4">
      <SubmitButton className="btn-primary w-full" pendingLabel="Ouverture…">
        Commencer la vérification
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
