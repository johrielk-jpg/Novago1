import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PROTECTED = [
  '/recherche',
  '/profil',
  '/selection',
  '/messages',
  '/dashboard-femme',
  '/compte',
  '/verification',
  '/moderation',
];

/**
 * Rafraîchit la session Supabase à chaque requête et ferme l'accès aux
 * profils tant que le compte n'est pas connecté (section 5 : aucun accès aux
 * profils sans compte majeur vérifié en âge).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const needsAuth = PROTECTED.some((path) => request.nextUrl.pathname.startsWith(path));

  if (needsAuth && !data.user) {
    const redirect = new URL('/connexion', request.url);
    redirect.searchParams.set('suite', request.nextUrl.pathname);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};
