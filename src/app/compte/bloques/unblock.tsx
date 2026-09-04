'use client';

import { useFormState } from 'react-dom';
import { debloquer } from '@/app/actions/interactions';
import { SubmitButton } from '@/components/form';

export function UnblockButton({ blockedUserId }: { blockedUserId: string }) {
  const [, formAction] = useFormState(debloquer, {});
  return (
    <form action={formAction}>
      <input type="hidden" name="blockedUserId" value={blockedUserId} />
      <SubmitButton className="text-[12px] font-semibold underline">Débloquer</SubmitButton>
    </form>
  );
}
