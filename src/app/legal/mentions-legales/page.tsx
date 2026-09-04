export const metadata = { title: 'Mentions légales — Meet X' };

export default function MentionsPage() {
  return (
    <article>
      <h1 className="mt-5 font-display text-xl font-semibold">Mentions légales</h1>

      <h2>Éditeur</h2>
      <p>
        [RAISON SOCIALE] — [FORME JURIDIQUE], [CAPITAL] — [ADRESSE] — RCS [VILLE] [NUMÉRO] — TVA
        intracommunautaire [NUMÉRO].
      </p>

      <h2>Directeur de la publication</h2>
      <p>[NOM]</p>

      <h2>Hébergeur</h2>
      <p>
        Application : Netlify, Inc. — 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis.
        <br />
        Base de données et fichiers : Supabase, Inc. — [ADRESSE].
      </p>

      <h2>Contact</h2>
      <p>[EMAIL]</p>

      <h2>Statut du service</h2>
      <p>
        Meet X exerce une activité de mise en relation. La qualification exacte (hébergeur au sens de
        la LCEN ou éditeur de contenus) doit être arrêtée avec un juriste, car elle détermine le
        régime de responsabilité applicable aux contenus publiés par les membres.
      </p>
    </article>
  );
}
