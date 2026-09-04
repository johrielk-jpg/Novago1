'use client';

import { useFormState } from 'react-dom';
import { envoyerSigne } from '@/app/actions/signals';
import { FormFeedback, SubmitButton } from '@/components/form';

const LABELS: Record<string, string> = {
  envoye: 'Signe envoyé — en attente de réponse',
  accepte: 'Conversation ouverte',
  expire: 'Signe expiré',
};

export function SignalButton({
  targetUserId,
  currentStatus,
}: {
  targetUserId: string;
  currentStatus: string | null;
}) {
  const [state, formAction] = useFormState(envoyerSigne, {});

  if (currentStatus && currentStatus !== 'expire') {
    return (
      <p className="flex-1 rounded-pill bg-paper-2 px-5 py-3 text-center text-sm font-semibold text-grey">
        {LABELS[currentStatus] ?? currentStatus}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex-1">
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <SubmitButton className="btn-primary w-full" pendingLabel="Envoi…">
        Envoyer un signe
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
