# Mise en route — de « mode démo » à application réelle

Marche à suivre complète. Comptez 30 à 45 minutes. Tout ce qui touche aux clés se fait
chez vous : aucune clé ne doit être collée dans une conversation, un ticket ou un commit.

---

## 1. Créer le projet Supabase

1. https://supabase.com → **New project**.
2. Région : **Europe (Frankfurt ou Paris)**. Pas les États-Unis — vous hébergerez des données
   personnelles de résidents européens, et cela change ce que vous devrez écrire dans la politique
   de confidentialité.
3. Notez le mot de passe de la base : il ne s'affiche qu'une fois.
4. Une fois le projet prêt : **Project Settings → API**. Vous y trouvez trois valeurs :

| Valeur dans Supabase | Variable | Où elle va |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | navigateur + serveur |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | navigateur + serveur |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` | **serveur uniquement** |

> La clé `service_role` contourne toute la sécurité (RLS). Elle ne doit jamais apparaître dans une
> variable préfixée `NEXT_PUBLIC_`, ni dans le dépôt. Si elle fuite, régénérez-la immédiatement
> depuis le même écran.

---

## 2. Appliquer le schéma

Le plus simple : **SQL Editor** dans le dashboard Supabase. Ouvrez chaque fichier du dépôt,
copiez-collez son contenu, exécutez — **dans cet ordre**, en vérifiant « Success » à chaque fois :

1. `supabase/migrations/0001_schema.sql` — les tables
2. `supabase/migrations/0002_rls.sql` — la sécurité (RLS, vues, `send_signal`)
3. `supabase/migrations/0003_storage_cron.sql` — buckets privés + tâches planifiées
4. `supabase/seed.sql` — la liste des centres d'intérêt

N'appliquez **jamais** `supabase/tests/_stubs_local.sql` sur Supabase : ce fichier ne sert qu'à
rejouer les tests sur un Postgres nu, il recréerait des objets système.

Variante en ligne de commande, si vous installez le CLI Supabase :

```bash
supabase link --project-ref <ref-du-projet>
supabase db push
```

### Vérifier que c'est bon

Dans le SQL Editor :

```sql
-- doit renvoyer 12 tables, toutes avec rowsecurity = true
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;

-- doit renvoyer 15 lignes
select count(*) from public.interests;

-- doit renvoyer les deux buckets, public = false
select id, public from storage.buckets;
```

Si une table a `rowsecurity = false`, arrêtez tout et reprenez `0002_rls.sql` : sans RLS, la clé
`anon` lit toute la base.

---

## 3. Régler l'authentification

**Authentication → Providers → Email** :

- **Confirm email : activé.** Sans confirmation, n'importe qui crée un compte avec l'adresse d'un
  autre. Sur une plateforme de rencontre, c'est la première porte d'entrée des faux profils.
- **Authentication → URL Configuration** : `Site URL` = votre domaine (`http://localhost:3000` en
  développement).

---

## 4. Lancer en local

```bash
cp .env.example .env.local
# renseigner les 3 valeurs de l'étape 1 dans .env.local
npm install
npm run dev
```

Le bandeau noir « Mode démo » en haut de page doit **disparaître**. S'il est toujours là, c'est que
les deux variables `NEXT_PUBLIC_*` ne sont pas lues — vérifiez le nom du fichier (`.env.local`, pas
`.env.local.txt`) et redémarrez `npm run dev`.

### Se donner les droits de modération

Créez d'abord votre compte depuis `/inscription`, puis dans le SQL Editor :

```sql
update public.users set is_moderator = true where email = 'votre@email.fr';
```

`/moderation` devient accessible. C'est là que passent les photos et les profils avant mise en
ligne — en v1, c'est vous.

### Dérouler le parcours complet

1. Créez un compte « Je m'inscris » (profil femme) → `/verification` → **Commencer la
   vérification** → l'écran de simulation → **Valider**.
2. `/profil/moi` : ajoutez une photo, remplissez le profil, **Publier mon profil**.
3. Avec votre compte modérateur, `/moderation` : approuvez la photo et mettez le profil en ligne.
4. Créez un compte « Je recherche » (profil homme) → `/recherche` → le profil apparaît → **Envoyer
   un signe**.
5. Revenez sur le compte femme → `/dashboard-femme` → acceptez → la conversation s'ouvre des deux
   côtés.
6. Refaites l'opération avec un second compte homme, mais **refusez** : côté expéditeur, le signe
   doit rester affiché « en attente ». C'est le comportement attendu, pas un bug.

---

## 5. Déployer sur Netlify

1. Netlify → **Add new site → Import an existing project** → ce dépôt.
2. La configuration de build est déjà dans `netlify.toml`, ne la modifiez pas.
3. **Site settings → Environment variables** — ajoutez :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL        = https://votre-domaine
IDENTITY_PROVIDER           = mock      (tant que le prestataire n'est pas choisi)
MODERATION_PROVIDER         = mock
CRON_SECRET                 = une chaîne aléatoire longue
```

4. Retournez dans Supabase mettre l'URL de production dans **Authentication → URL Configuration**.

> Tant que `IDENTITY_PROVIDER=mock`, l'écran de simulation est désactivé en production (`NODE_ENV`),
> donc **plus personne ne peut se faire vérifier** : les profils femmes ne pourront pas être
> publiés. C'est volontaire — pas de faux badge « Vérifiée ». Voir l'étape 7.

---

## 6. Les tâches planifiées

`0003_storage_cron.sql` installe les jobs `pg_cron` si l'extension est disponible. Vérifiez :

```sql
select jobname, schedule from cron.job;
```

Vous devez voir `meetx-expire-signals`, `meetx-purge-identity`, `meetx-purge-accounts`. Si la
requête échoue (extension absente sur votre plan), utilisez le repli : une Scheduled Function
Netlify qui appelle `POST /api/cron` toutes les heures avec l'en-tête `x-cron-secret`.

Sans ces tâches, les signes n'expirent jamais et les suppressions de compte RGPD ne s'exécutent pas.

---

## 7. Avant d'ouvrir à de vrais utilisateurs

Aucun de ces points n'est cosmétique — ils conditionnent la légalité du service.

- [ ] **Prestataire de vérification d'identité** choisi et câblé (Veriff, Onfido ou IDnow).
      L'adaptateur Veriff existe dans `src/lib/identity/index.ts` mais n'a jamais tourné contre
      l'API réelle : il faudra le tester avec vos clés. Passez ensuite `IDENTITY_PROVIDER=veriff`,
      renseignez `IDENTITY_API_KEY` et `IDENTITY_WEBHOOK_SECRET`, et déclarez l'URL de webhook
      `https://votre-domaine/api/verification/webhook` chez le prestataire.
- [ ] **Pré-filtre photo** activé (`MODERATION_PROVIDER=sightengine` + les deux clés). En `mock`,
      100 % des photos passent par vous à la main.
- [ ] **Textes juridiques** relus par un avocat : `src/app/legal/*` contient des `[PLACEHOLDERS]`
      (raison sociale, adresse, prestataires, durées de conservation). Deux points à trancher avec
      lui : votre statut hébergeur ou éditeur, et la légalité du filtre par nationalité.
- [ ] **Structure juridique** créée (auto-entreprise ou société) — vous devez être identifiable
      comme responsable de traitement avant la première donnée personnelle collectée.
- [ ] **Nom de domaine** réservé et branché.
- [ ] **Sauvegardes** vérifiées dans Supabase (Database → Backups) et procédure de restauration
      testée une fois.
