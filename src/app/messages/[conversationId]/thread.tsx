'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { envoyerMessage } from '@/app/actions/interactions';
import { SubmitButton, FormFeedback } from '@/components/form';
import { getBrowserSupabase } from '@/lib/supabase/client';
import type { MessageRow } from '@/lib/types';

/**
 * Fil de discussion. Les nouveaux messages arrivent par Supabase Realtime ;
 * seuls les deux participants sont autorisés à lire la table (RLS), donc le
 * canal ne diffuse rien d'autre à ce client.
 */
export function Thread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageRow[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [state, formAction] = useFormState(envoyerMessage, {});
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMessages(initialMessages), [initialMessages]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as MessageRow;
          setMessages((current) =>
            current.some((item) => item.id === message.id) ? current : [...current, message],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <>
      <div className="flex flex-1 flex-col gap-2.5 px-5 py-4">
        {messages.map((message) => (
          <p
            key={message.id}
            className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug ${
              message.sender_id === currentUserId
                ? 'self-end rounded-br-sm bg-wine text-white'
                : 'self-start rounded-bl-sm border border-line bg-white'
            }`}
          >
            {message.body}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        ref={formRef}
        action={(formData) => {
          formAction(formData);
          formRef.current?.reset();
        }}
        className="sticky bottom-16 flex gap-2 border-t border-line bg-paper px-4 py-3"
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <input
          name="body"
          required
          maxLength={4000}
          placeholder="Écrire un message…"
          className="flex-1 rounded-pill bg-paper-2 px-4 py-2.5 text-[13px] outline-none"
        />
        <SubmitButton className="btn-primary h-10 w-10 !px-0" pendingLabel="…">
          ➤
        </SubmitButton>
      </form>
      <div className="px-5">
        <FormFeedback state={state} />
      </div>
    </>
  );
}
