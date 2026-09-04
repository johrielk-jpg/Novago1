export const metadata = { title: 'CGU — Meet X' };

export default function CguPage() {
  return (
    <article>
      <h1 className="mt-5 font-display text-xl font-semibold">Conditions générales d’utilisation</h1>
      <p className="text-grey">Version de travail — dernière mise à jour : [DATE].</p>

      <h2>1. Objet</h2>
      <p>
        Meet X est un service de mise en relation entre personnes majeures. Le service met à
        disposition un répertoire de profils, un mécanisme de « signe » et une messagerie ouverte
        uniquement après accord de la personne destinataire.
      </p>

      <h2>2. Accès au service — condition d’âge</h2>
      <p>
        L’inscription est strictement réservée aux personnes âgées de 18 ans révolus. La date de
        naissance est contrôlée à l’inscription. Tout compte pour lequel Meet X constate ou
        soupçonne une minorité est suspendu immédiatement, sans préavis.
      </p>

      <h2>3. Vérification d’identité</h2>
      <p>
        La publication d’un profil est subordonnée à une vérification d’identité réalisée par un
        prestataire spécialisé ([PRESTATAIRE]). Meet X ne conserve ni la pièce d’identité ni le
        selfie transmis : seul le résultat de la vérification est enregistré.
      </p>

      <h2>4. Contenus publiés par les membres</h2>
      <p>
        Chaque membre reste responsable des contenus qu’il publie. Sont notamment interdits : les
        contenus sexuellement explicites, les contenus violents, les propos haineux ou
        discriminatoires, l’usurpation d’identité, la sollicitation commerciale et toute tentative
        d’escroquerie.
      </p>
      <p>
        Les photographies sont soumises à un filtrage automatique puis à une revue humaine avant
        publication. Meet X peut refuser ou retirer un contenu sans préavis.
      </p>

      <h2>5. Fonctionnement des signes et des conversations</h2>
      <ul>
        <li>Un membre peut adresser un « signe » à un profil visible.</li>
        <li>La personne destinataire décide seule d’accepter ou de refuser.</li>
        <li>
          Un refus n’est pas notifié à l’expéditeur, et un nouveau signe vers la même personne
          n’est pas possible.
        </li>
        <li>Un signe sans réponse expire automatiquement au bout de 14 jours.</li>
        <li>Une conversation n’est accessible qu’aux deux personnes concernées.</li>
      </ul>

      <h2>6. Signalement, blocage et sanctions</h2>
      <p>
        Tout membre peut signaler un profil ou bloquer un autre compte depuis l’application. Les
        signalements sont traités par l’équipe de modération, qui peut avertir, suspendre ou
        supprimer un compte.
      </p>

      <h2>7. Suppression du compte</h2>
      <p>
        Le compte peut être supprimé à tout moment depuis les paramètres. Le profil est masqué
        immédiatement ; les données sont effacées au terme d’un délai de 30 jours, sauf obligation
        légale de conservation.
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        Meet X fournit un service de mise en relation et n’est pas partie aux échanges entre
        membres. Il appartient à chacun de faire preuve de prudence lors des rencontres. [Clause de
        limitation de responsabilité à rédiger avec un juriste.]
      </p>

      <h2>9. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit français. [Clause de juridiction à préciser.]</p>
    </article>
  );
}
