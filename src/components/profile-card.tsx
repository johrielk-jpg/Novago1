import Link from 'next/link';
import type { ProfileCard as Card } from '@/lib/types';
import { gradientFor } from '@/lib/demo';
import { formatDistance } from '@/lib/geo';
import { FavoriteButton } from '@/components/favorite-button';

/** Vignette horizontale de l'accueil (écran 1 des maquettes). */
export function MiniCard({ card, badge }: { card: Card; badge?: React.ReactNode }) {
  return (
    <article className="relative w-32 shrink-0 snap-start">
      <Link href={`/profil/${card.id}`} className="block">
        <div
          className="flex h-40 w-32 items-center justify-center rounded-xl bg-cover bg-center font-display text-lg text-white"
          style={
            card.photoUrl
              ? { backgroundImage: `url(${card.photoUrl})` }
              : { backgroundImage: gradientFor(card.id) }
          }
        >
          {!card.photoUrl && `${card.first_name.charAt(0)}.`}
        </div>
      </Link>
      <FavoriteButton
        profileId={card.id}
        isFavorite={card.isFavorite}
        className="absolute right-2 top-2"
      />
      {badge && (
        <span className="absolute bottom-[4.6rem] left-2 flex items-center gap-1 rounded-pill bg-ink/75 px-2 py-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}
      <div className="pt-2">
        <p className="text-[13px] font-semibold">
          {card.first_name}, {card.age}
        </p>
        <p className="mt-px truncate text-[11px] text-grey">
          {card.city}
          {card.distanceKm != null && ` · ${formatDistance(card.distanceKm)}`}
        </p>
      </div>
    </article>
  );
}

/** Carte de la liste de résultats (écran 3 des maquettes). */
export function ResultCard({ card }: { card: Card }) {
  return (
    <article className="card mb-3.5 flex gap-3 p-3">
      <Link href={`/profil/${card.id}`} className="shrink-0">
        <span
          className="flex h-[88px] w-[76px] items-center justify-center rounded-xl bg-cover bg-center font-display text-xl text-white"
          style={
            card.photoUrl
              ? { backgroundImage: `url(${card.photoUrl})` }
              : { backgroundImage: gradientFor(card.id) }
          }
        >
          {!card.photoUrl && `${card.first_name.charAt(0)}.`}
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/profil/${card.id}`} className="text-[15px] font-semibold">
            {card.first_name}, {card.age}
          </Link>
          <span className="flex items-center gap-2">
            {card.verification_status === 'verifie' && (
              <span className="rounded-pill bg-[#E8EEE9] px-2 py-0.5 text-[10.5px] font-semibold text-sage">
                ✓ Vérifiée
              </span>
            )}
            <span
              aria-label={card.online ? 'En ligne' : 'Hors ligne'}
              className={`h-2 w-2 rounded-full ${card.online ? 'bg-sage' : 'bg-line'}`}
            />
          </span>
        </div>

        <p className="mb-1.5 mt-0.5 text-xs text-grey">
          {card.city}
          {card.distanceKm != null && ` · ${formatDistance(card.distanceKm)}`}
        </p>

        {card.bio && <p className="line-clamp-2 text-[12.5px] leading-snug">{card.bio}</p>}

        <div className="mt-2 flex items-center justify-between">
          <span className="flex flex-wrap gap-1.5">
            {card.interests.slice(0, 2).map((interest) => (
              <span key={interest} className="rounded-pill border border-line bg-paper-2 px-3 py-1 text-[12px]">
                {interest}
              </span>
            ))}
          </span>
          <FavoriteButton profileId={card.id} isFavorite={card.isFavorite} />
        </div>
      </div>
    </article>
  );
}
