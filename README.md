# Meet X

Plateforme de mise en relation. Un **répertoire de profils**, pas une file à swiper : on recherche,
on filtre, on envoie un « signe » — et la conversation ne s'ouvre que si la personne l'accepte.

Ce dépôt hébergeait auparavant Novago ; l'ancienne page est archivée dans
[`docs/novago-legacy.html`](docs/novago-legacy.html).

- Brief technique : [`docs/brief-technique.md`](docs/brief-technique.md)
- Maquettes d'origine (10 écrans) : [`docs/maquettes-v1.html`](docs/maquettes-v1.html)

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Postgres, Auth, Storage, Realtime) ·
Netlify.

## Démarrer

```bash
npm install
cp .env.example .env.local   # facultatif
npm run dev
```

Sans `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, l'app démarre en **mode démo** :
les écrans publics s'affichent avec des profils fictifs et toute écriture est refusée. Un bandeau le
signale en haut de page.

### Avec un projet Supabase

1. Créer un projet, puis appliquer dans l'ordre :

```bash
supabase db push          # ou psql -f sur chaque fichier
# supabase/migrations/0001_schema.sql
# supabase/migrations/0002_rls.sql
# supabase/migrations/0003_storage_cron.sql
# supabase/seed.sql
```

2. Renseigner `.env.local` (voir `.env.example`).
3. Se donner les droits de modération sur son propre compte :
   `update public.users set is_moderator = true where email = '…';`

## Routes

| Route | Écran |
|---|---|
| `/` | Accueil — En ligne / Proche / Appréciées / Nouvelles |
| `/inscription`, `/connexion` | Création de compte (18+ contrôlé) et connexion |
| `/verification` | Vérification d'identité par prestataire tiers |
| `/recherche` | Filtres lieu, âge, taille, vérifié, langues, nationalité + tri |
| `/profil/[id]` | Fiche détaillée, envoi d'un signe, signalement, blocage |
| `/profil/moi` | Édition du profil et gestion des photos |
| `/selection` | Signes envoyés et favoris |
| `/messages`, `/messages/[conversationId]` | Messagerie temps réel |
| `/dashboard-femme` | Visibilité + signes reçus (accepter / refuser) |
| `/compte`, `/compte/bloques` | Paramètres, comptes bloqués, suppression RGPD |
| `/moderation` | File de revue humaine (photos, profils, signalements) |
| `/legal/*` | CGU, confidentialité, mentions légales |

## Ce qui est verrouillé au niveau de la base

Les règles sensibles ne sont pas seulement dans l'interface : elles sont appliquées en SQL, donc
elles tiennent même si un client appelle l'API directement.

- **18+** — trigger sur `public.users`, en plus du contrôle applicatif.
- **Refus silencieux** — l'expéditeur ne voit jamais le statut `refuse` ; sa ligne reste affichée
  « en attente » jusqu'à l'expiration normale, et un renvoi via `send_signal()` ne lève aucune
  erreur.
- **Conversations** — accessibles aux deux participants uniquement.
- **Photos** — bucket privé, rien de visible avant `approuvee` ; le pré-filtre automatique ne peut
  que rejeter, jamais publier.
- **Publication d'un profil** — passe obligatoirement par la file de modération, et par la
  vérification d'identité pour un profil femme.
- **Nationalité** — masquée par la vue `profiles_public` tant que la personne ne l'a pas activée.
- **Expiration à 14 jours** — `expire_stale_signals()`, planifiée par `pg_cron` ou appelée sur
  `POST /api/cron`.

### Rejouer les tests SQL

```bash
psql -f supabase/tests/_stubs_local.sql      # Postgres nu seulement, pas sur Supabase
psql -f supabase/migrations/0001_schema.sql  # puis 0002, 0003, seed.sql
psql -f supabase/tests/rls_test.sql          # 15 contrôles, « OK … » / « ÉCHEC … »
```

## Ce qu'il reste à trancher avant une vraie mise en ligne

- **Prestataire de vérification d'identité.** `IDENTITY_PROVIDER=mock` par défaut : le parcours est
  complet mais la décision est simulée et l'écran de simulation n'existe pas en production. Un
  adaptateur Veriff est écrit (non testé contre l'API réelle) ; Onfido et IDnow lèvent une erreur
  explicite.
- **Pré-filtre de modération.** `MODERATION_PROVIDER=mock` envoie tout en revue humaine. Un
  adaptateur Sightengine est écrit (non testé contre l'API réelle).
- **Qui tient la file de modération** au lancement.
- **Textes juridiques.** `/legal/*` couvre les points attendus mais contient des `[PLACEHOLDERS]` et
  doit être relu par un juriste — en particulier la qualification hébergeur / éditeur et la
  légalité du filtre nationalité.
- **Structure juridique et nom de domaine** avant toute collecte de données réelles.

## Hors scope v1

Abonnement payant, application mobile native, modération entièrement automatisée, notation par
étoiles, interface multilingue.
