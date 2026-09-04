export const metadata = { title: 'Politique de confidentialité — Meet X' };

export default function ConfidentialitePage() {
  return (
    <article>
      <h1 className="mt-5 font-display text-xl font-semibold">Politique de confidentialité</h1>
      <p className="text-grey">Version de travail — dernière mise à jour : [DATE].</p>

      <h2>1. Responsable de traitement</h2>
      <p>[RAISON SOCIALE], [ADRESSE], contact : [EMAIL]. [Structure juridique à créer avant toute collecte réelle.]</p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>Compte : e-mail, mot de passe (haché), date de naissance, rôle.</li>
        <li>Profil : prénom, ville, position approximative, taille, langues, biographie, photos.</li>
        <li>
          Nationalité : facultative, masquée par défaut, publiée uniquement sur activation explicite
          par la personne concernée.
        </li>
        <li>Vérification d’identité : identifiant de session chez le prestataire et verdict.</li>
        <li>Usage : signes, favoris, conversations, signalements, blocages, dernière connexion.</li>
      </ul>

      <h2>3. Bases légales</h2>
      <ul>
        <li>Exécution du contrat : gestion du compte, des profils et de la messagerie.</li>
        <li>Obligation légale et intérêt légitime : modération, prévention des fraudes, sécurité.</li>
        <li>Consentement explicite : publication de la nationalité, données de vérification.</li>
      </ul>

      <h2>4. Données sensibles</h2>
      <p>
        La nationalité et les données liées à la vérification d’identité font l’objet d’un
        traitement restreint : chiffrement au repos, accès limité aux personnes habilitées,
        conservation limitée. Le filtre de recherche par nationalité est doublement facultatif : il
        n’écarte des profils que si la personne qui recherche l’active, et ne porte que sur les
        profils ayant choisi d’afficher cette information.
      </p>

      <h2>5. Durées de conservation</h2>
      <ul>
        <li>Compte actif : durée de vie du compte.</li>
        <li>Compte supprimé : effacement définitif 30 jours après la demande.</li>
        <li>Traces de vérification d’identité : 90 jours maximum.</li>
        <li>Éléments de modération et signalements : [DURÉE — à fixer avec un juriste].</li>
      </ul>

      <h2>6. Destinataires et sous-traitants</h2>
      <ul>
        <li>Hébergement et base de données : Supabase.</li>
        <li>Hébergement applicatif : Netlify.</li>
        <li>Vérification d’identité : [PRESTATAIRE].</li>
        <li>Analyse automatique des photos : [PRESTATAIRE].</li>
        <li>E-mails transactionnels : Resend.</li>
      </ul>
      <p>[Vérifier la localisation des données et les clauses de transfert hors UE pour chaque prestataire.]</p>

      <h2>7. Vos droits</h2>
      <p>
        Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition
        et de portabilité. Ces droits s’exercent depuis les paramètres du compte ou par e-mail à
        [EMAIL]. Vous pouvez introduire une réclamation auprès de la CNIL.
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Cloisonnement des accès par Row Level Security au niveau de la base, stockage privé des
        photos avec URL signées à durée limitée, aucune conservation des pièces d’identité.
      </p>
    </article>
  );
}
