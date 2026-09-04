import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { env } from '@/lib/env';
import { StartVerification } from './start';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vérification d’identité — Meet X' };

const RESULT_LABEL: Record<string, string> = {
  verifie: 'Votre identité est vérifiée. Votre profil peut être publié.',
  rejete: 'La vérification n’a pas abouti. Vous pouvez recommencer.',
};

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: { resultat?: string };
}) {
  const session = await getSession();
  if (!session) redirect('/connexion?suite=/verification');

  const status = session.account.verification_status;

  return (
    <div className="px-5 pt-6">
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-paper-2 text-2xl">
          🛡️
        </span>
        <h1 className="font-display text-lg font-semibold">Vérifiez votre identité</h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-grey">
          Un profil vérifié inspire confiance. C’est aussi ce qui garde Meet X sûr : la vérification
          est obligatoire avant la publication d’un profil.
        </p>
      </div>

      {searchParams.resultat && (
        <p className="safety-note mt-4 text-center">{RESULT_LABEL[searchParams.resultat]}</p>
      )}

      <div className="card mt-5 p-4">
        <p className="text-[13.5px] font-semibold">
          Statut :{' '}
          {status === 'verifie'
            ? 'vérifié'
            : status === 'en_cours'
              ? 'vérification en cours'
              : status === 'rejete'
                ? 'refusée'
                : 'non vérifié'}
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-grey">
          La vérification est réalisée par un prestataire spécialisé (pièce d’identité + selfie).
          Nous ne conservons ni votre pièce d’identité ni votre selfie : seul le verdict est stocké,
          et il est purgé au bout de 90 jours.
        </p>
      </div>

      {status !== 'verifie' && <StartVerification />}

      {env.identityProvider === 'mock' && (
        <p className="safety-note mt-4">
          Prestataire non configuré (IDENTITY_PROVIDER=mock) : le parcours est simulé et ne vaut pas
          vérification. À câbler sur Veriff / Onfido / IDnow avant toute mise en production
          (point 7 du brief).
        </p>
      )}
    </div>
  );
}
