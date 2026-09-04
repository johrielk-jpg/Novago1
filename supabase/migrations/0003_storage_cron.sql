-- =====================================================================
-- Meet X — v1 : stockage, expiration des signes, rétention RGPD
-- =====================================================================

-- ---------------------------------------------------------------------
-- Buckets privés. Aucune photo n'est servie en URL publique : l'app génère
-- des URL signées côté serveur, uniquement pour les photos approuvées.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos',   'photos',   false, 8388608,  array['image/jpeg', 'image/png', 'image/webp']),
  ('identity', 'identity', false, 16777216, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

-- Convention de chemin : photos/<user_id>/<uuid>.jpg
create policy "photos: dépôt par le propriétaire" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: lecture par le propriétaire" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: suppression par le propriétaire" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: lecture par la modération" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and public.is_moderator());

-- Le bucket 'identity' n'a volontairement AUCUNE policy : seul le
-- service_role (webhook du prestataire de vérification) y accède.

-- ---------------------------------------------------------------------
-- Tâches planifiées
-- ---------------------------------------------------------------------

-- Section 4.4 — un signe sans réponse expire au bout de 14 jours.
create or replace function public.expire_stale_signals()
returns integer language plpgsql security definer set search_path = public as $$
declare
  touched integer;
begin
  update public.signals
     set status = 'expire'
   where status = 'envoye'
     and expires_at <= now();
  get diagnostics touched = row_count;
  return touched;
end;
$$;

-- RGPD — purge des traces de vérification d'identité arrivées à échéance.
create or replace function public.purge_identity_verifications()
returns integer language plpgsql security definer set search_path = public as $$
declare
  touched integer;
begin
  delete from public.identity_verifications where purge_after <= now();
  get diagnostics touched = row_count;
  return touched;
end;
$$;

-- RGPD — suppression définitive des comptes après le délai de rétractation.
-- La suppression de auth.users cascade sur public.users et tout le reste.
create or replace function public.purge_deleted_accounts()
returns integer language plpgsql security definer set search_path = public as $$
declare
  touched integer;
begin
  delete from auth.users a
   using public.users u
   where u.id = a.id
     and u.deletion_scheduled_at is not null
     and u.deletion_scheduled_at <= now();
  get diagnostics touched = row_count;
  return touched;
end;
$$;

revoke all on function public.expire_stale_signals()          from public, anon, authenticated;
revoke all on function public.purge_identity_verifications()  from public, anon, authenticated;
revoke all on function public.purge_deleted_accounts()        from public, anon, authenticated;

-- pg_cron n'est pas activé par défaut sur tous les plans Supabase : si
-- l'extension est absente, appeler ces fonctions depuis un cron externe
-- (Netlify Scheduled Function) avec la clé service_role.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('meetx-expire-signals',    '7 * * * *',  $cron$select public.expire_stale_signals();$cron$);
    perform cron.schedule('meetx-purge-identity',    '23 3 * * *', $cron$select public.purge_identity_verifications();$cron$);
    perform cron.schedule('meetx-purge-accounts',    '41 3 * * *', $cron$select public.purge_deleted_accounts();$cron$);
  end if;
end;
$$;
