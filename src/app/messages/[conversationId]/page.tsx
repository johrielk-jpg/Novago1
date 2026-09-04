import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getConversation } from '@/lib/queries';
import { getSession } from '@/lib/session';
import { gradientFor } from '@/lib/demo';
import { Thread } from './thread';

export const dynamic = 'force-dynamic';

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const [data, session] = await Promise.all([getConversation(params.conversationId), getSession()]);
  if (!data || !session) notFound();

  return (
    <div className="flex min-h-[70vh] flex-col">
      <header className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
        <Link href="/messages" aria-label="Retour" className="text-base">
          ←
        </Link>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full font-display text-xs text-white"
          style={{ backgroundImage: gradientFor(data.card?.id ?? data.conversation.id) }}
        >
          {data.card?.first_name.charAt(0) ?? '·'}.
        </span>
        <span>
          <span className="block text-[14.5px] font-semibold">
            {data.card ? `${data.card.first_name}, ${data.card.age}` : 'Membre'}
          </span>
          {data.card?.online && <span className="text-[11.5px] text-sage">En ligne maintenant</span>}
        </span>
      </header>

      <Thread
        conversationId={params.conversationId}
        currentUserId={session.account.id}
        initialMessages={data.messages}
      />
    </div>
  );
}
