'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { bloquer, signaler } from '@/app/actions/interactions';
import { FormFeedback, SubmitButton } from '@/components/form';

const REASONS = [
  ['photos', 'Photos inappropriées'],
  ['harcelement', 'Harcèlement ou insultes'],
  ['faux_profil', 'Faux profil / usurpation'],
  ['arnaque', 'Tentative d’arnaque'],
  ['autre', 'Autre'],
] as const;

/** Signalement et blocage — opérationnels dès la v1 (section 5 du brief). */
export function SafetyActions({ targetUserId, isBlocked }: { targetUserId: string; isBlocked: boolean }) {
  const [open, setOpen] = useState(false);
  const [reportState, reportAction] = useFormState(signaler, {});
  const [blockState, blockAction] = useFormState(bloquer, {});

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex gap-3 text-[12px] font-semibold text-grey">
        <button type="button" onClick={() => setOpen((value) => !value)} className="underline">
          Signaler ce profil
        </button>
        {!isBlocked && (
          <form action={blockAction}>
            <input type="hidden" name="blockedUserId" value={targetUserId} />
            <SubmitButton className="underline">Bloquer</SubmitButton>
          </form>
        )}
        {isBlocked && <span>Compte bloqué</span>}
      </div>
      <FormFeedback state={blockState} />

      {open && (
        <form action={reportAction} className="card mt-3 p-4">
          <input type="hidden" name="reportedUserId" value={targetUserId} />
          <label className="field-label" htmlFor="reason">
            Motif
          </label>
          <select id="reason" name="reason" className="field mb-3" defaultValue="photos">
            {REASONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor="details">
            Précisions (facultatif)
          </label>
          <textarea id="details" name="details" rows={3} maxLength={2000} className="field mb-3" />
          <SubmitButton className="btn-primary w-full">Envoyer le signalement</SubmitButton>
          <FormFeedback state={reportState} />
        </form>
      )}
    </div>
  );
}
