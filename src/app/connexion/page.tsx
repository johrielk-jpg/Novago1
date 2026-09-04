import Link from 'next/link';
import { ConnexionForm } from './form';

export const metadata = { title: 'Se connecter — Meet X' };

export default function ConnexionPage({ searchParams }: { searchParams: { suite?: string } }) {
  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-xl font-semibold">Se connecter</h1>
      <p className="mb-5 mt-1.5 text-[13px] text-grey">Retrouvez votre sélection et vos conversations.</p>

      <ConnexionForm suite={searchParams.suite ?? ''} />

      <p className="mt-5 text-center text-[11.5px] text-grey">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="font-semibold text-ink underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
