'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from '@/lib/session';

const LINKS = [
  { href: '/', label: 'Accueil', icon: '⌂' },
  { href: '/recherche', label: 'Recherche', icon: '🔍' },
  { href: '/selection', label: 'Sélection', icon: '♥' },
  { href: '/messages', label: 'Messages', icon: '💬' },
];

export function BottomNav({ session }: { session: Session | null }) {
  const pathname = usePathname();
  if (!session) return null;

  const links =
    session.account.role === 'femme'
      ? [...LINKS.slice(0, 2), { href: '/dashboard-femme', label: 'Mes signes', icon: '✦' }, LINKS[3]]
      : LINKS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur">
      <ul className="mx-auto flex w-full max-w-3xl">
        {links.map((link) => {
          const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-semibold ${
                  active ? 'text-wine' : 'text-grey'
                }`}
              >
                <span aria-hidden className="text-base leading-none">
                  {link.icon}
                </span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
