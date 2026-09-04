'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { inscription } from '@/app/actions/auth';
import { FormFeedback, SubmitButton } from '@/components/form';

/** Date maximale acceptée : la majorité est vérifiée ici, côté serveur et en SQL. */
function maxBirthDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().slice(0, 10);
}

export function InscriptionForm() {
  const [state, formAction] = useFormState(inscription, {});
  const [role, setRole] = useState<'homme' | 'femme'>('homme');

  return (
    <form action={formAction}>
      <fieldset className="mb-4">
        <legend className="field-label">Je crée un compte en tant que</legend>
        <div className="flex gap-2.5">
          {(
            [
              { value: 'homme', icon: '🔎', label: 'Je recherche' },
              { value: 'femme', icon: '✦', label: 'Je m’inscris' },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`flex-1 cursor-pointer rounded-xl border-[1.5px] bg-white p-4 text-center ${
                role === option.value ? 'border-wine bg-[#FBF3F5]' : 'border-line'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                className="sr-only"
                checked={role === option.value}
                onChange={() => setRole(option.value)}
              />
              <span aria-hidden className="mb-1.5 block text-xl">
                {option.icon}
              </span>
              <span className="text-[13px] font-semibold">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field-label" htmlFor="firstName">
        Prénom
      </label>
      <input id="firstName" name="firstName" required maxLength={40} className="field mb-3.5" />

      <label className="field-label" htmlFor="birthDate">
        Date de naissance
      </label>
      <input
        id="birthDate"
        name="birthDate"
        type="date"
        required
        max={maxBirthDate()}
        className="field mb-1"
      />
      <p className="mb-3.5 text-[11px] text-grey">Meet X est strictement réservé aux personnes majeures.</p>

      <label className="field-label" htmlFor="city">
        Ville
      </label>
      <input id="city" name="city" required className="field mb-3.5" />

      <label className="field-label" htmlFor="email">
        E-mail
      </label>
      <input id="email" name="email" type="email" required className="field mb-3.5" placeholder="vous@exemple.com" />

      <label className="field-label" htmlFor="password">
        Mot de passe
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        minLength={8}
        className="field mb-4"
        placeholder="8 caractères minimum"
      />

      <label className="mb-4 flex items-start gap-2.5 text-[12px] leading-relaxed text-grey">
        <input type="checkbox" name="cgu" required className="mt-0.5 accent-wine" />
        <span>
          J’ai 18 ans ou plus et j’accepte les{' '}
          <Link href="/legal/cgu" className="underline">
            CGU
          </Link>{' '}
          et la{' '}
          <Link href="/legal/confidentialite" className="underline">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>

      <SubmitButton className="btn-primary w-full">Continuer</SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
