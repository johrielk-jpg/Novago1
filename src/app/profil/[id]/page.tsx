import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProfileDetail } from '@/lib/queries';
import { getSession } from '@/lib/session';
import { gradientFor } from '@/lib/demo';
import { formatDistance } from '@/lib/geo';
import { FavoriteButton } from '@/components/favorite-button';
import { SignalButton } from './signal-button';
import { SafetyActions } from './safety-actions';

export const dynamic = 'force-dynamic';

export default async function ProfilPage({ params }: { params: { id: string } }) {
  const [profile, session] = await Promise.all([getProfileDetail(params.id), getSession()]);
  if (!profile) notFound();

  const cover = profile.photos[0] ?? profile.photoUrl;

  return (
    <article>
      <div className="relative h-[340px]">
        <div
          className="flex h-full w-full items-center justify-center bg-cover bg-center font-display text-6xl text-white"
          style={cover ? { backgroundImage: `url(${cover})` } : { backgroundImage: gradientFor(profile.id) }}
        >
          {!cover && `${profile.first_name.charAt(0)}.`}
        </div>
        <Link
          href="/recherche"
          aria-label="Retour"
          className="absolute left-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink/55 text-white"
        >
          ←
        </Link>
        {profile.photos.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {profile.photos.map((photo, index) => (
              <span
                key={photo}
                className={`h-[3px] w-4 rounded ${index === 0 ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-[23px] font-semibold">
            {profile.first_name}, {profile.age}
          </h1>
          {profile.verification_status === 'verifie' && (
            <span className="rounded-pill bg-[#E8EEE9] px-2 py-1 text-[10.5px] font-semibold text-sage">
              ✓ Vérifiée
            </span>
          )}
        </div>

        <p className="mb-4 mt-1 text-[13px] text-grey">
          {profile.city}
          {profile.distanceKm != null && ` · ${formatDistance(profile.distanceKm)}`}
          {profile.height_cm != null && ` · ${profile.height_cm} cm`}
          {profile.nationality && ` · ${profile.nationality}`}
        </p>

        {profile.bio && (
          <>
            <p className="mb-2 text-xs text-grey">À propos</p>
            <p className="mb-4 text-sm leading-relaxed">{profile.bio}</p>
          </>
        )}

        {profile.languages.length > 0 && (
          <>
            <p className="mb-2 text-xs text-grey">Langues parlées</p>
            <p className="mb-4 text-sm">{profile.languages.join(', ')}</p>
          </>
        )}

        {profile.interests.length > 0 && (
          <>
            <p className="mb-2 text-xs text-grey">Centres d’intérêt</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((interest) => (
                <span key={interest} className="rounded-pill border border-line bg-paper-2 px-3 py-1.5 text-[12.5px]">
                  {interest}
                </span>
              ))}
            </div>
          </>
        )}

        {session && (
          <>
            <div className="mt-5 flex items-center gap-2.5">
              <SignalButton targetUserId={profile.user_id} currentStatus={profile.signalStatus} />
              <FavoriteButton profileId={profile.id} isFavorite={profile.isFavorite} />
            </div>

            <p className="safety-note mt-4">
              Un « signe » prévient {profile.first_name} de votre intérêt. La conversation ne s’ouvre
              que si elle décide d’y répondre — et vous ne pouvez en envoyer qu’un seul.
            </p>

            <SafetyActions targetUserId={profile.user_id} isBlocked={profile.isBlocked} />
          </>
        )}
      </div>
    </article>
  );
}
