'use client';

import { useFormState } from 'react-dom';
import { majVisibilite } from '@/app/actions/profile';
import { FormFeedback, SubmitButton } from '@/components/form';
import { Toggle } from '@/components/toggle';
import type { ProfileRow } from '@/lib/types';

const LABELS: Record<string, string> = {
  brouillon: 'Brouillon — non publié',
  en_attente_moderation: 'En attente de revue par la modération',
  visible: 'En ligne',
  masque: 'Masqué',
};

export function VisibilityCard({ profile }: { profile: ProfileRow | null }) {
  const [state, formAction] = useFormState(majVisibilite, {});

  if (!profile) {
    return <p className="safety-note">Créez d’abord votre profil pour gérer sa visibilité.</p>;
  }

  return (
    <form action={formAction} className="card p-4">
      <h2 className="section-title">Visibilité</h2>
      <p className="mb-2 mt-1 text-xs leading-relaxed text-grey">
        Décidez qui peut vous trouver dans les résultats de recherche.
        <br />
        Statut actuel : <strong>{LABELS[profile.visibility]}</strong>
      </p>

      <Toggle
        name="visible"
        label="Profil visible"
        hint="Apparaît dans les recherches"
        defaultChecked={profile.visibility === 'visible'}
      />
      <Toggle
        name="verifiedOnly"
        label="Réservé aux profils vérifiés"
        hint="Filtre les comptes non confirmés"
        defaultChecked={profile.verified_only}
      />

      <label className="mt-3 block">
        <span className="field-label">Distance maximale (km, vide = sans limite)</span>
        <input
          type="number"
          name="maxDistanceKm"
          min={1}
          max={300}
          defaultValue={profile.max_distance_km ?? ''}
          className="field"
        />
      </label>

      <SubmitButton className="btn-primary mt-3 w-full">Enregistrer</SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
