import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { DeleteAccount } from './delete-account';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Compte & paramètres — Meet X' };

const ROWS = [
  { href: '/profil/moi', icon: '👤', label: 'Informations personnelles' },
  { href: '/dashboard-femme', icon: '🔒', label: 'Confidentialité & visibilité' },
  { href: '/verification', icon: '🛡️', label: 'Vérification d’identité' },
  { href: '/compte/bloques', icon: '⛔', label: 'Comptes bloqués' },
  { href: '/legal/cgu', icon: '📄', label: 'CGU & confidentialité' },
];

export default async function ComptePage() {
  const session = await getSession();
  if (!session) redirect('/connexion?suite=/compte');

  return (
    <div>
      <h1 className="px-5 pb-3 pt-4 font-display text-lg font-semibold">Compte</h1>

      <p className="px-5 pb-3 text-[12px] text-grey">
        {session.account.email} · {session.account.role === 'femme' ? 'profil publié' : 'compte de recherche'}
      </p>

      {ROWS.map((row) => (
        <Link key={row.href} href={row.href} className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-paper-2 text-sm">
            {row.icon}
          </span>
          <span className="flex-1 text-[13.5px] font-medium">{row.label}</span>
          <span className="text-[13px] text-grey">›</span>
        </Link>
      ))}

      {session.account.is_moderator && (
        <Link href="/moderation" className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-paper-2 text-sm">🧑‍⚖️</span>
          <span className="flex-1 text-[13.5px] font-medium">File de modération</span>
          <span className="text-[13px] text-grey">›</span>
        </Link>
      )}

      <DeleteAccount scheduledAt={session.account.deletion_scheduled_at} />
    </div>
  );
}
