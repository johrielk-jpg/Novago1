import Link from 'next/link';
import type { Session } from '@/lib/session';
import { deconnexion } from '@/app/actions/auth';

export function SiteHeader({ session }: { session: Session | null }) {
  const initials = session?.profile?.first_name?.slice(0, 2).toUpperCase() ?? null;

  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 pb-3 pt-4">
      <Link href="/" className="font-display text-xl font-semibold tracking-tight">
        Meet<span className="italic text-wine">&nbsp;X</span>
      </Link>

      {session ? (
        <div className="flex items-center gap-3">
          <Link
            href="/compte"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-wine to-brass text-xs font-semibold text-white"
            aria-label="Mon compte"
          >
            {initials ?? '··'}
          </Link>
          <form action={deconnexion}>
            <button type="submit" className="text-[12.5px] font-semibold text-grey hover:text-ink">
              Se déconnecter
            </button>
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link href="/connexion" className="text-[12.5px] font-semibold">
            Se connecter
          </Link>
          <Link href="/inscription" className="btn-primary px-4 py-2 text-[12.5px]">
            Créer un compte
          </Link>
        </div>
      )}
    </header>
  );
}
