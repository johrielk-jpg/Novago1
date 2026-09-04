import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getReceivedSignals } from '@/lib/queries';
import { gradientFor } from '@/lib/demo';
import { VisibilityCard } from './visibility-card';
import { SignalDecision } from './signal-decision';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mes signes — Meet X' };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/connexion?suite=/dashboard-femme');

  const signals = await getReceivedSignals();

  return (
    <div className="px-5 pt-4">
      <VisibilityCard profile={session.profile} />

      <section className="card mt-4 p-4">
        <h2 className="section-title">Signes reçus · {signals.length}</h2>
        <p className="mb-3 mt-1 text-xs leading-relaxed text-grey">
          Personne ne vous écrit sans votre accord. Acceptez pour ouvrir la conversation.
        </p>

        {signals.length === 0 ? (
          <p className="text-[12.5px] text-grey">Aucun signe en attente.</p>
        ) : (
          signals.map(({ signal, card }) => (
            <div key={signal.id} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-[13px] text-white"
                style={{ backgroundImage: gradientFor(card?.id ?? signal.id) }}
              >
                {card?.first_name.charAt(0) ?? '·'}.
              </span>
              <span className="flex-1">
                <span className="block text-[13.5px] font-semibold">
                  {card ? `${card.first_name}, ${card.age}` : 'Membre'}
                </span>
                <span className="block text-[11.5px] text-grey">
                  {card?.city ?? '—'}
                  {card?.distanceKm != null && ` · à ${card.distanceKm} km`}
                </span>
              </span>
              <SignalDecision signalId={signal.id} />
            </div>
          ))
        )}
      </section>

      <p className="pt-5 text-center text-[11.5px] leading-relaxed text-grey">
        Refuser un signe est silencieux : aucune
        <br />
        notification n’est envoyée à l’expéditeur.
      </p>
    </div>
  );
}
