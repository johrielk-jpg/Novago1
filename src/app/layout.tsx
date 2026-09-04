import type { Metadata, Viewport } from 'next';
import { Fraunces, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { BottomNav } from '@/components/bottom-nav';
import { getSession } from '@/lib/session';
import { isSupabaseConfigured } from '@/lib/env';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Meet X — Un répertoire de profils, pas une file à swiper',
  description:
    'Meet X : recherchez, filtrez et choisissez qui contacter. Profils vérifiés, conversation ouverte uniquement sur accord.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#7C2340' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans">
        {!isSupabaseConfigured && (
          <p className="bg-ink px-4 py-2 text-center text-[11.5px] text-paper">
            Mode démo — aucun projet Supabase configuré. Profils fictifs, écritures désactivées.
          </p>
        )}
        <SiteHeader session={session} />
        <main className="mx-auto w-full max-w-3xl pb-24">{children}</main>
        <BottomNav session={session} />
      </body>
    </html>
  );
}
