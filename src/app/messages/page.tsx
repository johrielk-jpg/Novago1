import Link from 'next/link';
import { getConversations } from '@/lib/queries';
import { gradientFor } from '@/lib/demo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Messages — Meet X' };

export default async function MessagesPage() {
  const conversations = await getConversations();

  return (
    <div>
      <h1 className="px-5 pb-3 pt-4 font-display text-lg font-semibold">Messages</h1>

      {conversations.length === 0 ? (
        <p className="safety-note mx-5">
          Aucune conversation pour l’instant. Une conversation s’ouvre lorsqu’un signe est accepté.
        </p>
      ) : (
        conversations.map(({ conversation, card, lastMessage, unread }) => (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className="flex items-center gap-3 border-b border-line px-5 py-3"
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-sm text-white"
              style={{ backgroundImage: gradientFor(card?.id ?? conversation.id) }}
            >
              {card?.first_name.charAt(0) ?? '·'}.
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  {card ? `${card.first_name}, ${card.age}` : 'Membre'}
                </span>
                {unread > 0 && (
                  <span className="rounded-pill bg-wine px-2 py-0.5 text-[10.5px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block truncate text-[12.5px] text-grey">
                {lastMessage ?? 'Conversation ouverte — à vous d’écrire.'}
              </span>
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
