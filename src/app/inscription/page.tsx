import Link from 'next/link';
import { InscriptionForm } from './form';

export const metadata = { title: 'Créer mon compte — Meet X' };

export default function InscriptionPage() {
  return (
    <div className="px-5">
      <div className="flex gap-1.5 pb-1.5 pt-4">
        <span className="h-1 flex-1 rounded bg-wine" />
        <span className="h-1 flex-1 rounded bg-line" />
        <span className="h-1 flex-1 rounded bg-line" />
      </div>
      <p className="pb-3.5 pt-0.5 text-[11.5px] text-grey">
        Étape 1 / 3 — votre compte. Étape 2 : votre profil. Étape 3 : la vérification d’identité.
      </p>

      <InscriptionForm />

      <p className="mt-5 text-center text-[11.5px] leading-relaxed text-grey">
        Déjà inscrit ?{' '}
        <Link href="/connexion" className="font-semibold text-ink underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
