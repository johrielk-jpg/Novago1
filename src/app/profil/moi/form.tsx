'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { enregistrerProfil, publierProfil } from '@/app/actions/profile';
import { FormFeedback, SubmitButton } from '@/components/form';
import type { AccountRow, ProfileRow } from '@/lib/types';

const LANGUAGES = ['Français', 'Anglais', 'Espagnol', 'Italien', 'Arabe', 'Allemand', 'Portugais'];

export function ProfileForm({
  profile,
  account,
  interests,
  selectedInterests,
}: {
  profile: ProfileRow | null;
  account: AccountRow;
  interests: { slug: string; label: string }[];
  selectedInterests: string[];
}) {
  const [state, formAction] = useFormState(enregistrerProfil, {});
  const [publishState, publishAction] = useFormState(publierProfil, {});
  const [languages, setLanguages] = useState<string[]>(profile?.languages ?? []);
  const [chosen, setChosen] = useState<string[]>(selectedInterests);
  const [showNationality, setShowNationality] = useState(profile?.nationality_visible ?? false);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  return (
    <>
      <form action={formAction} className="mt-5">
        <input type="hidden" name="languages" value={languages.join(',')} />
        <input type="hidden" name="interests" value={chosen.join(',')} />

        <label className="field-label" htmlFor="firstName">
          Prénom
        </label>
        <input id="firstName" name="firstName" required defaultValue={profile?.first_name ?? ''} className="field mb-3.5" />

        <label className="field-label" htmlFor="bio">
          À propos de vous
        </label>
        <textarea id="bio" name="bio" rows={4} maxLength={1000} defaultValue={profile?.bio ?? ''} className="field mb-3.5" />

        <label className="field-label" htmlFor="city">
          Ville
        </label>
        <input id="city" name="city" required defaultValue={profile?.city ?? ''} className="field mb-3.5" />

        <label className="field-label" htmlFor="heightCm">
          Taille (cm)
        </label>
        <input
          id="heightCm"
          name="heightCm"
          type="number"
          min={120}
          max={230}
          defaultValue={profile?.height_cm ?? ''}
          className="field mb-3.5"
        />

        <p className="field-label">Langues parlées</p>
        <div className="mb-3.5 flex flex-wrap gap-2">
          {LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => toggle(languages, language, setLanguages)}
              className={`tag ${languages.includes(language) ? 'tag-on' : ''}`}
            >
              {language}
            </button>
          ))}
        </div>

        <label className="field-label" htmlFor="nationality">
          Nationalité <span className="font-normal text-grey">(facultatif)</span>
        </label>
        <input
          id="nationality"
          name="nationality"
          defaultValue={profile?.nationality ?? ''}
          placeholder="Non renseignée"
          className="field mb-1"
        />
        <label className="mb-1 flex items-center justify-between border-t border-line py-3">
          <span>
            <span className="block text-[13.5px]">Afficher ma nationalité</span>
            <span className="mt-0.5 block text-[11px] text-grey">
              Désactivé par défaut, visible seulement si vous l’activez
            </span>
          </span>
          <input
            type="checkbox"
            name="nationalityVisible"
            checked={showNationality}
            onChange={(event) => setShowNationality(event.target.checked)}
            className="accent-wine"
          />
        </label>
        <p className="safety-note mb-4">
          La nationalité est une donnée sensible : elle n’est jamais affichée ni utilisée comme
          filtre tant que vous ne l’activez pas ici.
        </p>

        <p className="field-label">Centres d’intérêt</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {interests.map((interest) => (
            <button
              key={interest.slug}
              type="button"
              onClick={() => toggle(chosen, interest.slug, setChosen)}
              className={`tag ${chosen.includes(interest.slug) ? 'tag-on' : ''}`}
            >
              {interest.label}
            </button>
          ))}
        </div>

        <SubmitButton className="btn-ghost w-full">Enregistrer</SubmitButton>
        <FormFeedback state={state} />
      </form>

      <form action={publishAction} className="mt-3">
        <SubmitButton className="btn-primary w-full">Publier mon profil</SubmitButton>
        <FormFeedback state={publishState} />
        {account.role === 'femme' && account.verification_status !== 'verifie' && (
          <p className="safety-note mt-3">
            Publication possible une fois la vérification d’identité terminée.
          </p>
        )}
      </form>
    </>
  );
}
