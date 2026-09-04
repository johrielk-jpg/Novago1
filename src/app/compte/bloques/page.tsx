import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabase/server';
import { UnblockButton } from './unblock';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Comptes bloqués — Meet X' };

export default async function BloquesPage() {
  const session = await getSession();
  if (!session) redirect('/connexion?suite=/compte/bloques');

  const supabase = getServerSupabase();
  const { data } = (await supabase
    ?.from('blocks')
    .select('blocked_user_id, created_at')
    .eq('user_id', session.account.id)
    .order('created_at', { ascending: false })) ?? { data: [] };

  return (
    <div className="px-5 pt-4">
      <h1 className="font-display text-lg font-semibold">Comptes bloqués</h1>
      <p className="mb-4 mt-1 text-[12px] leading-relaxed text-grey">
        Un compte bloqué ne peut plus vous voir, vous écrire ni vous envoyer de signe — et
        réciproquement.
      </p>

      {(data ?? []).length === 0 ? (
        <p className="safety-note">Aucun compte bloqué.</p>
      ) : (
        (data ?? []).map((block) => (
          <div
            key={block.blocked_user_id}
            className="flex items-center justify-between border-b border-line py-3"
          >
            <span className="text-[13px]">
              Compte {block.blocked_user_id.slice(0, 8)} · bloqué le{' '}
              {new Date(block.created_at).toLocaleDateString('fr-FR')}
            </span>
            <UnblockButton blockedUserId={block.blocked_user_id} />
          </div>
        ))
      )}
    </div>
  );
}
