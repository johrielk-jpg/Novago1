-- =====================================================================
-- Meet X — tests des règles non négociables (sections 4 et 5 du brief).
-- À rejouer après toute modification des migrations :
--   psql -f supabase/tests/_stubs_local.sql      (Postgres nu uniquement)
--   psql -f supabase/migrations/0001_schema.sql  … 0003
--   psql -f supabase/tests/rls_test.sql
-- Chaque contrôle affiche « OK : … » ou « ÉCHEC : … ».
-- =====================================================================

-- Privilèges équivalents à ceux que Supabase accorde par défaut.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

set client_min_messages = notice;

-- ---------- Jeu d'essai ----------
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.users (id, email, role, birth_date, cgu_accepted_at, verification_status) values
  ('11111111-1111-1111-1111-111111111111', 'thomas@example.test',  'homme', '1990-03-14', now(), 'verifie'),
  ('22222222-2222-2222-2222-222222222222', 'lea@example.test',     'femme', '1996-05-02', now(), 'verifie'),
  ('33333333-3333-3333-3333-333333333333', 'nicolas@example.test', 'homme', '1988-01-09', now(), 'verifie');

insert into public.profiles (user_id, first_name, city, visibility) values
  ('11111111-1111-1111-1111-111111111111', 'Thomas',  'Paris',    'visible'),
  ('22222222-2222-2222-2222-222222222222', 'Léa',     'Boulogne', 'visible'),
  ('33333333-3333-3333-3333-333333333333', 'Nicolas', 'Paris',    'visible');

-- ---------- 1. Âge minimum ----------
do $$
begin
  insert into auth.users (id) values ('44444444-4444-4444-4444-444444444444');
  insert into public.users (id, email, role, birth_date)
    values ('44444444-4444-4444-4444-444444444444', 'mineur@example.test', 'homme',
            current_date - interval '17 years');
  raise warning 'ÉCHEC 1 : un mineur a pu s''inscrire';
exception when check_violation then
  raise notice 'OK 1 : inscription d''un mineur refusée';
end $$;

-- ---------- 2 à 5. Le refus est silencieux ----------
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
declare statut public.signal_status;
begin
  statut := public.send_signal('22222222-2222-2222-2222-222222222222');
  if statut = 'envoye' then raise notice 'OK 2 : signe envoyé';
  else raise warning 'ÉCHEC 2 : statut inattendu %', statut; end if;
end $$;

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$
declare recus int;
begin
  select count(*) into recus from public.signals where receiver_id = auth.uid() and status = 'envoye';
  if recus = 1 then raise notice 'OK 3 : la destinataire voit le signe';
  else raise warning 'ÉCHEC 3 : % signe(s) visible(s)', recus; end if;
  update public.signals set status = 'refuse', responded_at = now()
   where receiver_id = auth.uid() and status = 'envoye';
end $$;

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$
declare lignes int; affiche public.signal_status;
begin
  select count(*) into lignes from public.signals;
  select status into affiche from public.signals_sent;
  if lignes = 0 and affiche = 'envoye' then
    raise notice 'OK 4 : le refus est invisible pour l''expéditeur (affiché « en attente »)';
  else
    raise warning 'ÉCHEC 4 : % ligne(s) brute(s) visible(s), statut affiché %', lignes, affiche;
  end if;
end $$;

do $$
declare statut public.signal_status;
begin
  statut := public.send_signal('22222222-2222-2222-2222-222222222222');
  if statut = 'envoye' then raise notice 'OK 5 : renvoyer un signe après refus reste silencieux';
  else raise warning 'ÉCHEC 5 : statut %', statut; end if;
end $$;

-- ---------- 6 et 7. Un signe accepté ouvre une conversation privée ----------
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select public.send_signal('22222222-2222-2222-2222-222222222222');

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$
declare nb int;
begin
  update public.signals set status = 'accepte', responded_at = now()
   where receiver_id = auth.uid() and status = 'envoye';
  select count(*) into nb from public.conversations;
  if nb = 1 then raise notice 'OK 6 : l''acceptation ouvre la conversation';
  else raise warning 'ÉCHEC 6 : % conversation(s)', nb; end if;
end $$;

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$
declare nb int;
begin
  select count(*) into nb from public.conversations;
  if nb = 0 then raise notice 'OK 7 : un tiers ne voit pas la conversation';
  else raise warning 'ÉCHEC 7 : % conversation(s) visible(s) par un tiers', nb; end if;
end $$;

-- ---------- 8. Pas d'auto-promotion ni d'auto-vérification ----------
do $$
begin
  update public.users set is_moderator = true where id = auth.uid();
  raise warning 'ÉCHEC 8 : auto-promotion possible';
exception when insufficient_privilege then
  raise notice 'OK 8 : auto-promotion refusée';
end $$;

-- ---------- 9. Pas de mise en ligne sans modération ----------
do $$
begin
  update public.profiles set visibility = 'brouillon' where user_id = auth.uid();
  update public.profiles set visibility = 'visible' where user_id = auth.uid();
  raise warning 'ÉCHEC 9 : publication directe possible';
exception when insufficient_privilege then
  raise notice 'OK 9 : publication directe refusée';
end $$;

-- ---------- 10. Profil femme : vérification d'identité obligatoire ----------
reset role;
update public.users set verification_status = 'non_verifie'
 where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set visibility = 'brouillon'
 where user_id = '22222222-2222-2222-2222-222222222222';

set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$
begin
  update public.profiles set visibility = 'en_attente_moderation' where user_id = auth.uid();
  raise warning 'ÉCHEC 10 : publication sans vérification d''identité';
exception when insufficient_privilege then
  raise notice 'OK 10 : publication bloquée tant que l''identité n''est pas vérifiée';
end $$;

-- ---------- 11. Expiration à 14 jours ----------
reset role;
update public.users set verification_status = 'verifie'
 where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set visibility = 'visible'
 where user_id = '22222222-2222-2222-2222-222222222222';

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
delete from public.favorites where false;  -- no-op, garde la session cohérente
reset role;
delete from public.signals;

insert into public.signals (sender_id, receiver_id, expires_at)
values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
        now() - interval '1 day');

do $$
declare expires int;
begin
  expires := public.expire_stale_signals();
  if expires = 1 then raise notice 'OK 11 : les signes sans réponse expirent après 14 jours';
  else raise warning 'ÉCHEC 11 : % signe(s) expiré(s)', expires; end if;
end $$;

-- ---------- 12. Nationalité : opt-in strict ----------
update public.profiles set nationality = 'Française', nationality_visible = false
 where user_id = '33333333-3333-3333-3333-333333333333';

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$
declare valeur text;
begin
  select nationality into valeur from public.profiles_public
   where user_id = '33333333-3333-3333-3333-333333333333';
  if valeur is null then raise notice 'OK 12 : nationalité masquée tant qu''elle n''est pas activée';
  else raise warning 'ÉCHEC 12 : nationalité exposée (%)', valeur; end if;
end $$;

reset role;
update public.profiles set nationality_visible = true
 where user_id = '33333333-3333-3333-3333-333333333333';

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$
declare valeur text;
begin
  select nationality into valeur from public.profiles_public
   where user_id = '33333333-3333-3333-3333-333333333333';
  if valeur = 'Française' then raise notice 'OK 12 bis : nationalité affichée après activation';
  else raise warning 'ÉCHEC 12 bis : valeur %', valeur; end if;
end $$;

-- ---------- 13. Blocage ----------
do $$
declare visible int;
begin
  insert into public.blocks (user_id, blocked_user_id)
  values (auth.uid(), '33333333-3333-3333-3333-333333333333');
  select count(*) into visible from public.profiles
   where user_id = '33333333-3333-3333-3333-333333333333';
  if visible = 0 then raise notice 'OK 13 : un compte bloqué disparaît des résultats';
  else raise warning 'ÉCHEC 13 : profil bloqué encore visible'; end if;
end $$;

-- ---------- 14. Photos non approuvées invisibles ----------
reset role;
insert into public.photos (profile_id, storage_path, sort_order, moderation_status)
select id, 'x/1.jpg', 0, 'en_attente' from public.profiles
 where user_id = '22222222-2222-2222-2222-222222222222';

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$
declare nb int;
begin
  select count(*) into nb from public.photos;
  if nb = 0 then raise notice 'OK 14 : une photo en attente n''est visible par personne d''autre';
  else raise warning 'ÉCHEC 14 : % photo(s) non modérée(s) visible(s)', nb; end if;
end $$;

reset role;
