import { notFound } from 'next/navigation';
import { env } from '@/lib/env';
import { SimulationForm } from './form';

export const dynamic = 'force-dynamic';

/**
 * Écran de simulation du prestataire — disponible uniquement en développement
 * avec IDENTITY_PROVIDER=mock. Il n'existe pas en production.
 */
export default function SimulationPage({ searchParams }: { searchParams: { session?: string } }) {
  if (env.identityProvider !== 'mock' || process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-lg font-semibold">Simulation du prestataire</h1>
      <p className="mb-4 mt-1.5 text-[13px] leading-relaxed text-grey">
        Écran de développement : il remplace le parcours du prestataire de vérification tant que
        celui-ci n’est pas choisi. Session {searchParams.session ?? '—'}.
      </p>
      <SimulationForm sessionId={searchParams.session ?? ''} />
    </div>
  );
}
