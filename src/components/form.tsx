'use client';

import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/app/actions/auth';

export function SubmitButton({
  children,
  className = 'btn-primary',
  pendingLabel,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} {...props}>
      {pending ? (pendingLabel ?? 'Un instant…') : children}
    </button>
  );
}

export function FormFeedback({ state }: { state: ActionState }) {
  if (!state.error && !state.success) return null;
  return (
    <p
      role="status"
      className={`mt-3 rounded-[10px] px-3.5 py-2.5 text-[12.5px] ${
        state.error ? 'bg-[#FBF3F5] text-wine' : 'bg-[#E8EEE9] text-sage'
      }`}
    >
      {state.error ?? state.success}
    </p>
  );
}
