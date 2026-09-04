'use client';

import { useFormState } from 'react-dom';
import { connexion } from '@/app/actions/auth';
import { FormFeedback, SubmitButton } from '@/components/form';

export function ConnexionForm({ suite }: { suite: string }) {
  const [state, formAction] = useFormState(connexion, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="suite" value={suite} />

      <label className="field-label" htmlFor="email">
        E-mail
      </label>
      <input id="email" name="email" type="email" required className="field mb-3.5" />

      <label className="field-label" htmlFor="password">
        Mot de passe
      </label>
      <input id="password" name="password" type="password" required className="field mb-4" />

      <SubmitButton className="btn-primary w-full">Se connecter</SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
