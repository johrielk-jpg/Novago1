'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { basculerFavori } from '@/app/actions/interactions';

function Heart({ isFavorite, className }: { isFavorite: boolean; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={isFavorite}
      className={`flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] text-sm transition ${
        isFavorite ? 'border-wine bg-wine text-white' : 'border-line bg-white/90 text-ink'
      } ${className ?? ''}`}
    >
      {isFavorite ? '♥' : '♡'}
    </button>
  );
}

export function FavoriteButton({
  profileId,
  isFavorite,
  className,
}: {
  profileId: string;
  isFavorite: boolean;
  className?: string;
}) {
  const [, formAction] = useFormState(basculerFavori, {});
  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="profileId" value={profileId} />
      <Heart isFavorite={isFavorite} />
    </form>
  );
}
