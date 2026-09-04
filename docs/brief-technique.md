# Meet X — Brief technique de build (v1)

> Document source fourni au démarrage du projet. Il fait foi sur le périmètre.
> Les écarts assumés lors de l'implémentation sont listés en fin de fichier.

Ce produit manipule des comptes utilisateurs, des données personnelles sensibles et de la
messagerie — le scope réel dépasse un site vitrine, donc le plan ci-dessous priorise ce qui doit
être solide dès la v1 (sécurité, âge, modération) et repousse le reste.

## 1. Stack

| Brique | Choix | Pourquoi |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind | Cohérent avec DriveConnect |
| Auth + DB + Storage + Realtime | Supabase (Postgres) | Un seul fournisseur pour compte, base, photos et messagerie temps réel |
| Vérification d'identité | Provider tiers (Veriff, Onfido ou IDnow) | La vérification « maison » n'est ni fiable ni défendable légalement |
| Emails transactionnels | Resend | Déjà utilisé sur DriveConnect |
| Déploiement | Netlify | Runtime Next.js supporté nativement |
| Modération de contenu | File manuelle v1 + pré-filtre API (Sightengine / Rekognition) | Pas de mise en ligne sans modération automatique préalable |

## 2. Modèle de données

- **users** — id, email, hash mdp, rôle (homme/femme), date de naissance, statut vérification, date de suppression prévue (RGPD)
- **profiles** — user_id, prénom, ville, lat/lng, taille_cm, nationalité (nullable), nationalité_visible (bool, défaut false), langues, bio, statut_visibilité
- **photos** — profile_id, url, ordre, statut_modération
- **interests** + **profile_interests**
- **signals** — sender_id, receiver_id, statut, créé_le ; un signal accepté crée une **conversation**
- **conversations** + **messages** (Supabase Realtime)
- **favorites** — user_id, profile_id
- **reports** — signalements, motif, statut de traitement
- **blocks** — user_id, blocked_user_id

## 3. Pages / routes

```
/                       Accueil (En ligne / Proche / Appréciées / Nouvelles)
/inscription            Étapes 1-3 (infos, rôle, vérification)
/verification           Vérification d'identité
/recherche              Filtres (lieu, âge, taille, vérifié, nationalité, langues) + tri
/profil/[id]            Fiche détaillée + « Envoyer un signe »
/selection              Signes envoyés + acceptés
/messages/[conversationId]
/dashboard-femme        Visibilité + signes reçus (accepter/refuser)
/compte                 Paramètres, confidentialité, suppression de compte
```

## 4. Mécanique produit

1. Un homme envoie un **signal** → statut `envoyé`, invisible pour la femme tant qu'elle n'a pas ouvert son dashboard.
2. La femme accepte ou refuse. **Refuser est silencieux** : aucune notification à l'expéditeur.
3. Accepter crée une conversation ; seuls les deux participants y ont accès (RLS par conversation_id).
4. Signal sans réponse après 14 jours → statut `expiré` (cron).

## 5. Sécurité, conformité et modération — non négociable en v1

- Vérification d'âge 18+ dès l'inscription, avant tout accès aux profils.
- Vérification d'identité par prestataire tiers avant publication d'un profil femme.
- Modération photo : filtre automatique + file de revue humaine avant mise en ligne.
- RGPD : nationalité et données de vérification traitées comme sensibles (accès restreint, durée limitée). Filtre nationalité opt-in des deux côtés, à faire valider par un avocat.
- Signalement et blocage fonctionnels dès la v1.
- CGU, politique de confidentialité, mentions légales en français (hébergeur vs éditeur à clarifier avec un juriste).

## 6. Hors scope v1

- Abonnement payant / premium
- Application mobile native
- Modération 100 % automatisée
- Notation par étoiles publiques (remplacée par le badge « % d'accords »)
- Multi-langue de l'interface

## 7. À trancher

- Budget / fournisseur pour la vérification d'identité
- Qui fait la revue humaine des photos au lancement
- Nom de domaine et structure juridique avant collecte de données réelles

---

## Écarts assumés lors de l'implémentation

1. **Mot de passe.** Le hash n'est pas dans `public.users` : il reste dans `auth.users`, géré par
   Supabase Auth. `public.users` porte les attributs métier.
2. **Photos.** La table stocke un `storage_path` dans un bucket privé, pas une URL publique. Les
   photos approuvées sont servies par URL signée à durée limitée, générée côté serveur.
3. **Accueil public.** La section 5 interdit l'accès aux profils sans compte majeur ; la page
   d'accueil non connectée affiche donc des vignettes explicitement illustratives, pas de vrais
   profils.
4. **Refus silencieux.** Masquer la ligne à l'expéditeur ne suffit pas : sa disparition trahirait le
   refus, et un renvoi buterait sur la contrainte d'unicité. Un signe refusé continue donc d'être
   affiché « en attente » à l'expéditeur jusqu'à sa date d'expiration normale, et l'envoi passe par
   une fonction SQL qui reste muette dans ce cas.
5. **Badge « % d'accords ».** Calculé en base, renvoyé seulement à partir de 5 réponses, pour éviter
   de rendre lisible la décision d'une personne en particulier.
6. **Mise en ligne des profils.** « Publier » place le profil en `en_attente_moderation` ; seul un
   modérateur peut le passer en `visible`.
