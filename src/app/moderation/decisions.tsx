'use client';

import { useFormState } from 'react-dom';
import { publierApresRevue, trancherPhoto, traiterSignalement } from '@/app/actions/moderation';
import { FormFeedback } from '@/components/form';

export function PhotoDecision({ photoId }: { photoId: string }) {
  const [state, formAction] = useFormState(trancherPhoto, {});
  return (
    <form action={formAction} className="mt-2 flex gap-1.5">
      <input type="hidden" name="photoId" value={photoId} />
      <button type="submit" name="decision" value="rejetee" className="btn-ghost flex-1 px-2 py-1.5 text-[11px]">
        Rejeter
      </button>
      <button type="submit" name="decision" value="approuvee" className="btn-primary flex-1 px-2 py-1.5 text-[11px]">
        Publier
      </button>
      <FormFeedback state={state} />
    </form>
  );
}

export function ProfileDecision({ profileId }: { profileId: string }) {
  const [, formAction] = useFormState(publierApresRevue, {});
  return (
    <form action={formAction} className="flex gap-1.5">
      <input type="hidden" name="profileId" value={profileId} />
      <button type="submit" name="decision" value="refuse" className="btn-ghost px-3 py-1.5 text-[11px]">
        Renvoyer
      </button>
      <button type="submit" name="decision" value="approuve" className="btn-primary px-3 py-1.5 text-[11px]">
        Mettre en ligne
      </button>
    </form>
  );
}

export function ReportDecision({ reportId }: { reportId: string }) {
  const [, formAction] = useFormState(traiterSignalement, {});
  return (
    <form action={formAction} className="mt-2 flex gap-1.5">
      <input type="hidden" name="reportId" value={reportId} />
      <button type="submit" name="status" value="rejete" className="btn-ghost px-3 py-1.5 text-[11px]">
        Sans suite
      </button>
      <button type="submit" name="status" value="traite" className="btn-primary px-3 py-1.5 text-[11px]">
        Traité
      </button>
    </form>
  );
}
