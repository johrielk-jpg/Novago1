'use client';

import { useFormState } from 'react-dom';
import { ajouterPhoto, supprimerPhoto } from '@/app/actions/profile';
import { FormFeedback, SubmitButton } from '@/components/form';
import type { PhotoRow } from '@/lib/types';

const STATUS_LABEL: Record<PhotoRow['moderation_status'], string> = {
  en_attente: 'En attente de revue',
  approuvee: 'En ligne',
  rejetee: 'Refusée',
};

export function PhotoManager({ photos }: { photos: PhotoRow[] }) {
  const [addState, addAction] = useFormState(ajouterPhoto, {});
  const [removeState, removeAction] = useFormState(supprimerPhoto, {});

  return (
    <section>
      <div className="grid grid-cols-3 gap-2.5">
        {photos.map((photo) => (
          <div key={photo.id} className="rounded-[10px] border border-line bg-white p-2 text-center">
            <p className="text-[10.5px] font-semibold text-grey">#{photo.sort_order + 1}</p>
            <p
              className={`my-1 text-[10.5px] ${
                photo.moderation_status === 'approuvee'
                  ? 'text-sage'
                  : photo.moderation_status === 'rejetee'
                    ? 'text-wine'
                    : 'text-brass'
              }`}
            >
              {STATUS_LABEL[photo.moderation_status]}
            </p>
            <form action={removeAction}>
              <input type="hidden" name="photoId" value={photo.id} />
              <SubmitButton className="text-[11px] underline">Supprimer</SubmitButton>
            </form>
          </div>
        ))}

        {photos.length < 6 && (
          <form
            action={addAction}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-dashed border-line bg-white p-2 text-center"
          >
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              required
              className="w-full text-[10px]"
            />
            <SubmitButton className="text-[11px] font-semibold underline" pendingLabel="Analyse…">
              Ajouter
            </SubmitButton>
          </form>
        )}
      </div>

      <FormFeedback state={addState} />
      <FormFeedback state={removeState} />

      <p className="safety-note mt-3">
        Chaque photo passe par un pré-filtre automatique puis par une revue humaine avant d’être
        visible. Aucune publication instantanée.
      </p>
    </section>
  );
}
