import { searchProfiles, type SearchFilters } from '@/lib/queries';
import { ResultCard } from '@/components/profile-card';
import { FiltersPanel } from './filters';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recherche — Meet X' };

function parseFilters(searchParams: Record<string, string | string[] | undefined>): SearchFilters {
  const one = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const list = (key: string) => (one(key) ?? '').split(',').map((v) => v.trim()).filter(Boolean);
  const num = (key: string) => {
    const value = Number(one(key));
    return Number.isFinite(value) && value > 0 ? value : undefined;
  };

  return {
    q: one('q') || undefined,
    city: one('ville') || undefined,
    radiusKm: num('rayon'),
    ageMin: num('age_min'),
    ageMax: num('age_max'),
    heightMin: num('taille_min'),
    heightMax: num('taille_max'),
    verifiedOnly: one('verifiees') === '1',
    languages: list('langues'),
    // Filtre nationalité : appliqué uniquement si l'utilisateur le renseigne.
    nationalities: list('nationalites'),
    interests: list('interets'),
    sort: (one('tri') as SearchFilters['sort']) ?? 'distance',
  };
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseFilters(searchParams);
  const results = await searchProfiles(filters);

  return (
    <div>
      <FiltersPanel filters={filters} resultCount={results.length} />

      <div className="flex items-baseline justify-between px-5 pb-3.5 pt-1">
        <h1 className="font-display text-lg font-semibold">
          {results.length} profil{results.length > 1 ? 's' : ''}
        </h1>
      </div>

      <div className="px-5">
        {results.length === 0 ? (
          <p className="safety-note">
            Aucun profil ne correspond à ces critères. Élargissez le rayon ou la tranche d’âge.
          </p>
        ) : (
          results.map((card) => <ResultCard key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}
