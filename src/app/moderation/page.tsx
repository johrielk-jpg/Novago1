import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getModerationQueue, getOpenReports } from '@/lib/queries';
import { getServerSupabase } from '@/lib/supabase/server';
import { PhotoDecision, ProfileDecision, ReportDecision } from './decisions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Modération — Meet X' };

/**
 * File de revue humaine (section 5). En v1 c'est l'exploitant qui la tient :
 * un compte avec users.is_moderator = true.
 */
export default async function ModerationPage() {
  const session = await getSession();
  if (!session?.account.is_moderator) notFound();

  const supabase = getServerSupabase();
  const [queue, reports, pendingProfiles] = await Promise.all([
    getModerationQueue(),
    getOpenReports(),
    supabase
      ? supabase
          .from('profiles')
          .select('id, first_name, city, created_at')
          .eq('visibility', 'en_attente_moderation')
          .order('updated_at', { ascending: true })
      : Promise.resolve({ data: [] as { id: string; first_name: string; city: string }[] }),
  ]);

  return (
    <div className="px-5 pt-4">
      <h1 className="font-display text-lg font-semibold">Modération</h1>

      <section className="mt-4">
        <h2 className="section-title">Profils en attente · {(pendingProfiles.data ?? []).length}</h2>
        {(pendingProfiles.data ?? []).map((profile) => (
          <div key={profile.id} className="flex items-center justify-between border-b border-line py-3">
            <span className="text-[13px]">
              {profile.first_name} · {profile.city}
            </span>
            <ProfileDecision profileId={profile.id} />
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="section-title">Photos en attente · {queue.length}</h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {queue.map(({ photo, profileName, url }) => (
            <div key={photo.id} className="card p-2">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="mb-2 aspect-[3/4] w-full rounded-[8px] object-cover" />
              ) : (
                <p className="mb-2 flex aspect-[3/4] items-center justify-center rounded-[8px] bg-paper-2 text-[11px] text-grey">
                  Aperçu indisponible
                </p>
              )}
              <p className="text-[12px] font-semibold">{profileName}</p>
              <PhotoDecision photoId={photo.id} />
            </div>
          ))}
        </div>
        {queue.length === 0 && <p className="safety-note mt-2">Aucune photo en attente.</p>}
      </section>

      <section className="mt-6 pb-6">
        <h2 className="section-title">Signalements ouverts · {reports.length}</h2>
        {reports.map((report) => (
          <div key={report.id} className="card mt-2 p-3">
            <p className="text-[12.5px] font-semibold">Motif : {report.reason}</p>
            {report.details && <p className="mt-1 text-[12px] text-grey">{report.details}</p>}
            <p className="mt-1 text-[11px] text-grey">
              Compte visé {String(report.reported_user_id).slice(0, 8)} ·{' '}
              {new Date(report.created_at).toLocaleDateString('fr-FR')}
            </p>
            <ReportDecision reportId={report.id} />
          </div>
        ))}
        {reports.length === 0 && <p className="safety-note mt-2">Aucun signalement en attente.</p>}
      </section>
    </div>
  );
}
