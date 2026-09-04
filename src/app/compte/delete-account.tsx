'use client';

import { useState } from 'react';
import { annulerSuppression, programmerSuppression } from '@/app/actions/profile';
import { SubmitButton } from '@/components/form';

/** RGPD — droit à l'effacement, avec 30 jours de rétractation. */
export function DeleteAccount({ scheduledAt }: { scheduledAt: string | null }) {
  const [confirm, setConfirm] = useState(false);

  if (scheduledAt) {
    return (
      <div className="px-5 py-5">
        <p className="safety-note">
          Suppression programmée le {new Date(scheduledAt).toLocaleDateString('fr-FR')}. Vos données
          seront effacées définitivement à cette date.
        </p>
        <form action={annulerSuppression} className="mt-3">
          <SubmitButton className="btn-ghost w-full">Annuler la suppression</SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="px-5 py-5">
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)} className="text-[13.5px] font-medium text-wine">
          Supprimer mon compte
        </button>
      ) : (
        <form action={programmerSuppression}>
          <p className="safety-note mb-3">
            Votre profil est masqué immédiatement, puis toutes vos données sont supprimées au bout de
            30 jours. Vous pouvez annuler pendant ce délai.
          </p>
          <SubmitButton className="btn-primary w-full">Confirmer la suppression</SubmitButton>
        </form>
      )}
    </div>
  );
}
