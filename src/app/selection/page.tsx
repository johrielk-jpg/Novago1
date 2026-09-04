import Link from 'next/link';
import { getSelection, getFavorites, getConversations } from '@/lib/queries';
import { gradientFor } from '@/lib/demo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ma sélection — Meet X' };

function Avatar({ id, name }: { id: string; name: string }) {
  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-sm text-white"
      style={{ backgroundImage: gradientFor(id) }}
    >
      {name.charAt(0)}.
    </span>
  );
}

export default async function SelectionPage() {
  const [selection, favorites, conversations] = await Promise.all([
    getSelection(),
    getFavorites(),
    getConversations(),
  ]);

  const openWith = new Map(conversations.map((c) => [c.otherUserId, c.conversation.id]));

  return (
    <div>
      <h1 className="px-5 pb-3 pt-4 font-display text-lg font-semibold">Ma sélection</h1>

      {selection.length === 0 && favorites.length === 0 && (
        <p className="safety-note mx-5">
          Votre sélection est vide. Envoyez un signe depuis une fiche profil pour l’y voir apparaître.
        </p>
      )}

      {selection.map(({ card, signal }) => {
        const conversationId = openWith.get(card.user_id);
        return (
          <div key={signal.id} className="flex items-center gap-3 border-b border-line px-5 py-3">
            <Avatar id={card.id} name={card.first_name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/profil/${card.id}`} className="text-sm font-semibold">
                  {card.first_name}, {card.age}
                </Link>
                {signal.status === 'accepte' ? (
                  <span className="rounded-pill bg-[#E8EEE9] px-2.5 py-1 text-[10.5px] font-semibold text-sage">
                    Conversation ouverte
                  </span>
                ) : (
                  <span className="rounded-pill bg-[#F6EEDF] px-2.5 py-1 text-[10.5px] font-semibold text-brass">
                    Signe envoyé
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[12.5px] text-grey">
                {signal.status === 'accepte' && conversationId ? (
                  <Link href={`/messages/${conversationId}`} className="underline">
                    Ouvrir la conversation
                  </Link>
                ) : (
                  `En attente de réponse — envoyé le ${new Date(signal.created_at).toLocaleDateString('fr-FR')}`
                )}
              </p>
            </div>
          </div>
        );
      })}

      {favorites.length > 0 && (
        <>
          <h2 className="section-title px-5 pb-2 pt-6">Favoris</h2>
          {favorites.map((card) => (
            <div key={card.id} className="flex items-center gap-3 border-b border-line px-5 py-3">
              <Avatar id={card.id} name={card.first_name} />
              <Link href={`/profil/${card.id}`} className="text-sm font-semibold">
                {card.first_name}, {card.age}
                <span className="ml-2 text-[12px] font-normal text-grey">{card.city}</span>
              </Link>
            </div>
          ))}
        </>
      )}

      <p className="px-5 pt-6 text-center text-[11.5px] leading-relaxed text-grey">
        Les profils sans réponse après 14 jours quittent
        <br />
        automatiquement votre sélection.
      </p>
    </div>
  );
}
