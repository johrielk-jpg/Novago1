import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getHomeSections } from '@/lib/queries';
import { MiniCard } from '@/components/profile-card';
import { demoProfiles, gradientFor } from '@/lib/demo';

export const dynamic = 'force-dynamic';

function Section({
  title,
  cards,
  badge,
}: {
  title: string;
  cards: Awaited<ReturnType<typeof getHomeSections>>['online'];
  badge?: (card: (typeof cards)[number]) => React.ReactNode;
}) {
  if (cards.length === 0) return null;
  return (
    <section>
      <div className="flex items-baseline justify-between px-5 pb-2.5 pt-5">
        <h2 className="section-title">{title}</h2>
        <Link href="/recherche" className="text-[11.5px] font-semibold text-brass">
          Voir tout
        </Link>
      </div>
      <div className="hscroll flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1.5">
        {cards.map((card) => (
          <MiniCard key={card.id} card={card} badge={badge?.(card)} />
        ))}
      </div>
    </section>
  );
}

/**
 * Vitrine publique. Aucun profil réel n'est exposé sans compte : les vignettes
 * ci-dessous sont illustratives (section 5 — pas d'accès aux profils avant
 * création d'un compte majeur).
 */
function PublicHome() {
  return (
    <>
      <section className="px-5 pt-2">
        <h1 className="font-display text-2xl font-semibold leading-tight">
          Un répertoire de profils, pas une file à swiper.
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-grey">
          Recherchez, filtrez, choisissez qui contacter. Un « signe » prévient la personne de votre
          intérêt : la conversation ne s’ouvre que si elle répond.
        </p>
      </section>

      <section className="mt-5 px-5">
        <div className="card p-4">
          {[
            'Profils vérifiés par un contrôle d’identité, pas par une simple photo.',
            'Personne ne vous écrit sans votre accord.',
            'Refuser un signe est silencieux : aucune relance possible.',
          ].map((line) => (
            <p key={line} className="flex gap-3 border-t border-line py-2.5 text-[13px] first:border-t-0 first:pt-0">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-wine" />
              {line}
            </p>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between px-5 pb-2.5 pt-6">
          <h2 className="section-title">Aperçu</h2>
          <span className="text-[11px] text-grey">Profils illustratifs</span>
        </div>
        <div className="hscroll flex gap-3 overflow-x-auto px-5 pb-1.5">
          {demoProfiles.slice(0, 6).map((profile) => (
            <div key={profile.id} className="w-32 shrink-0">
              <div
                className="flex h-40 w-32 items-center justify-center rounded-xl font-display text-lg text-white"
                style={{ backgroundImage: gradientFor(profile.id) }}
              >
                {profile.first_name.charAt(0)}.
              </div>
              <p className="pt-2 text-[13px] font-semibold">
                {profile.first_name}, {profile.age}
              </p>
              <p className="text-[11px] text-grey">{profile.city}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-5 mt-6 rounded-card bg-ink p-5 text-paper">
        <h3 className="font-display text-base font-semibold">Voir les profils complets</h3>
        <p className="mb-3.5 mt-1.5 text-[12.5px] leading-relaxed text-[#D8CFC3]">
          Créez un compte pour filtrer par ville, âge et centres d’intérêt, et envoyer un signe.
          Réservé aux personnes majeures.
        </p>
        <Link href="/inscription" className="btn-primary w-full">
          Créer mon compte
        </Link>
      </section>

      <p className="px-5 pt-6 text-center text-[11.5px] leading-relaxed text-grey">
        Meet X est réservé aux personnes de 18 ans et plus.
        <br />
        <Link href="/legal/cgu" className="underline">
          CGU
        </Link>{' '}
        ·{' '}
        <Link href="/legal/confidentialite" className="underline">
          Confidentialité
        </Link>{' '}
        ·{' '}
        <Link href="/legal/mentions-legales" className="underline">
          Mentions légales
        </Link>
      </p>
    </>
  );
}

export default async function HomePage() {
  const session = await getSession();
  if (!session) return <PublicHome />;

  const sections = await getHomeSections();

  return (
    <>
      <section className="px-5 pt-1">
        <Link href="/recherche" className="flex items-center gap-2 rounded-pill border border-line bg-white px-4 py-3 text-[13.5px] text-grey">
          🔍 Prénom, ville, centre d’intérêt…
        </Link>
      </section>

      <Section title="En ligne maintenant" cards={sections.online} badge={() => <>● En ligne</>} />
      <Section title="Proche de chez vous" cards={sections.nearby} badge={(card) => <>📍 {card.distanceKm} km</>} />
      <Section
        title="Les plus appréciées"
        cards={sections.appreciated}
        badge={(card) => <>{card.acceptance_rate}% d’accords</>}
      />
      <Section title="Nouvelles inscrites" cards={sections.newest} badge={() => <>Nouveau</>} />

      <section className="mx-5 mt-6 rounded-card bg-ink p-5 text-paper">
        <h3 className="font-display text-base font-semibold">
          {sections.total} profils correspondent à vos critères
        </h3>
        <p className="mb-3.5 mt-1.5 text-[12.5px] leading-relaxed text-[#D8CFC3]">
          Affinez par ville, âge, taille, langues et centres d’intérêt.
        </p>
        <Link href="/recherche" className="btn-primary w-full">
          Affiner la recherche
        </Link>
      </section>
    </>
  );
}
