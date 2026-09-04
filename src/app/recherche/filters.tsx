'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { SearchFilters } from '@/lib/queries';

const LANGUAGES = ['Français', 'Anglais', 'Espagnol', 'Italien', 'Arabe', 'Allemand', 'Portugais'];
const INTERESTS = [
  ['voyage', 'Voyage'],
  ['sport', 'Sport'],
  ['cuisine', 'Cuisine'],
  ['musique', 'Musique'],
  ['cinema', 'Cinéma'],
  ['lecture', 'Lecture'],
  ['series', 'Séries'],
  ['art', 'Art & expositions'],
] as const;
const SORTS = [
  ['distance', 'Distance'],
  ['recent', 'Dernière connexion'],
  ['apprecies', 'Les plus appréciées'],
] as const;

export function FiltersPanel({ filters, resultCount }: { filters: SearchFilters; resultCount: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  function push(next: Record<string, string | undefined>) {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) query.delete(key);
      else query.set(key, value);
    }
    router.push(`/recherche?${query.toString()}`);
  }

  function toggleInList(key: string, value: string) {
    const current = (params.get(key) ?? '').split(',').filter(Boolean);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    push({ [key]: next.join(',') || undefined });
  }

  const selected = (key: string, value: string) => (params.get(key) ?? '').split(',').includes(value);

  return (
    <div className="px-5 pt-1">
      <form
        className="flex items-center gap-2 rounded-pill border border-line bg-white px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get('q');
          push({ q: value ? String(value) : undefined });
        }}
      >
        <span aria-hidden>🔍</span>
        <input
          name="q"
          defaultValue={filters.q ?? ''}
          placeholder="Prénom, ville, centre d’intérêt…"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-grey"
        />
      </form>

      <div className="hscroll mt-3 flex gap-2 overflow-x-auto pb-1.5">
        <button type="button" onClick={() => setOpen((value) => !value)} className="tag tag-on">
          {open ? 'Masquer les filtres' : 'Affiner la recherche'}
        </button>
        {SORTS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => push({ tri: value })}
            className={`tag ${filters.sort === value ? 'tag-on' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {open && (
        <div className="card mt-3 p-4">
          <h2 className="section-title mb-3.5">Affiner la recherche</h2>

          <label className="field-label" htmlFor="ville">
            Lieu
          </label>
          <input
            id="ville"
            defaultValue={filters.city ?? ''}
            onBlur={(event) => push({ ville: event.target.value || undefined })}
            placeholder="Paris"
            className="field mb-3"
          />

          <label className="field-label" htmlFor="rayon">
            Rayon — {filters.radiusKm ?? 20} km
          </label>
          <input
            id="rayon"
            type="range"
            min={1}
            max={100}
            defaultValue={filters.radiusKm ?? 20}
            onChange={(event) => push({ rayon: event.target.value })}
            className="mb-4 w-full accent-wine"
          />

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="age_min">
                Âge minimum
              </label>
              <input
                id="age_min"
                type="number"
                min={18}
                max={99}
                defaultValue={filters.ageMin ?? 18}
                onBlur={(event) => push({ age_min: event.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="age_max">
                Âge maximum
              </label>
              <input
                id="age_max"
                type="number"
                min={18}
                max={99}
                defaultValue={filters.ageMax ?? 99}
                onBlur={(event) => push({ age_max: event.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="taille_min">
                Taille min. (cm)
              </label>
              <input
                id="taille_min"
                type="number"
                min={120}
                max={230}
                defaultValue={filters.heightMin ?? ''}
                onBlur={(event) => push({ taille_min: event.target.value || undefined })}
                className="field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="taille_max">
                Taille max. (cm)
              </label>
              <input
                id="taille_max"
                type="number"
                min={120}
                max={230}
                defaultValue={filters.heightMax ?? ''}
                onBlur={(event) => push({ taille_max: event.target.value || undefined })}
                className="field"
              />
            </div>
          </div>

          <label className="flex items-center justify-between border-t border-line py-3 text-[13.5px]">
            Profils vérifiés uniquement
            <input
              type="checkbox"
              defaultChecked={filters.verifiedOnly}
              onChange={(event) => push({ verifiees: event.target.checked ? '1' : undefined })}
              className="accent-wine"
            />
          </label>

          <p className="field-label mt-2">Langues parlées</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => toggleInList('langues', language)}
                className={`tag ${selected('langues', language) ? 'tag-on' : ''}`}
              >
                {language}
              </button>
            ))}
          </div>

          <p className="field-label mt-4">Centres d’intérêt</p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(([slug, label]) => (
              <button
                key={slug}
                type="button"
                onClick={() => toggleInList('interets', slug)}
                className={`tag ${selected('interets', slug) ? 'tag-on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="field-label mt-4">Nationalité</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => push({ nationalites: undefined })}
              className={`tag ${!params.get('nationalites') ? 'tag-on' : ''}`}
            >
              Toutes
            </button>
            {['Française', 'Belge', 'Suisse'].map((nationality) => (
              <button
                key={nationality}
                type="button"
                onClick={() => toggleInList('nationalites', nationality)}
                className={`tag ${selected('nationalites', nationality) ? 'tag-on' : ''}`}
              >
                {nationality}
              </button>
            ))}
          </div>

          <p className="safety-note mt-4">
            Le filtre de nationalité reste sur « Toutes » par défaut : il n’écarte des profils que si
            vous le modifiez explicitement, et il ne porte que sur les personnes ayant choisi
            d’afficher cette information. À faire valider juridiquement avant lancement.
          </p>

          <div className="mt-5 flex gap-2.5">
            <button type="button" onClick={() => router.push('/recherche')} className="btn-ghost flex-1">
              Réinitialiser
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-primary flex-1">
              Voir {resultCount} profils
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
