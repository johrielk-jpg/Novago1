import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabase/server';
import { ProfileForm } from './form';
import { PhotoManager } from './photos';
import type { PhotoRow } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mon profil — Meet X' };

export default async function MonProfilPage() {
  const session = await getSession();
  if (!session) redirect('/connexion?suite=/profil/moi');

  const supabase = getServerSupabase();
  const [{ data: photos }, { data: interests }, { data: selected }] = await Promise.all([
    supabase && session.profile
      ? supabase.from('photos').select('*').eq('profile_id', session.profile.id).order('sort_order')
      : Promise.resolve({ data: [] as PhotoRow[] }),
    supabase
      ? supabase.from('interests').select('slug, label').order('label')
      : Promise.resolve({ data: [] as { slug: string; label: string }[] }),
    supabase && session.profile
      ? supabase.from('profile_interests').select('interest_slug').eq('profile_id', session.profile.id)
      : Promise.resolve({ data: [] as { interest_slug: string }[] }),
  ]);

  return (
    <div className="px-5 pt-4">
      <h1 className="font-display text-lg font-semibold">Mon profil</h1>
      <p className="mb-4 mt-1 text-[11.5px] leading-relaxed text-grey">
        Ajoutez au moins 3 photos. La première est celle vue en premier. Chaque photo passe par la
        modération avant d’être visible.
      </p>

      <PhotoManager photos={(photos ?? []) as PhotoRow[]} />

      <ProfileForm
        profile={session.profile}
        account={session.account}
        interests={interests ?? []}
        selectedInterests={(selected ?? []).map((row) => row.interest_slug)}
      />
    </div>
  );
}
