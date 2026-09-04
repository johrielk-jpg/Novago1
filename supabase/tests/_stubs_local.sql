-- Doublures des objets fournis par Supabase (auth, storage), pour pouvoir
-- rejouer les migrations et les tests sur un Postgres nu.
-- À NE PAS appliquer sur un projet Supabase réel.

create schema if not exists auth;
create schema if not exists storage;
create extension if not exists pgcrypto;

create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create table if not exists storage.buckets (
  id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select string_to_array(name, '/')
$$;

do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;

grant usage on schema auth, storage to anon, authenticated;
grant select on auth.users to authenticated;
