-- =====================================================================
-- Meet X — v1 : schéma de base (section 2 du brief technique)
-- Le hash du mot de passe n'est PAS stocké ici : il vit dans auth.users
-- (Supabase Auth). public.users porte les attributs métier du compte.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------- Énumérations ----------
create type public.user_role           as enum ('homme', 'femme');
create type public.verification_status as enum ('non_verifie', 'en_cours', 'verifie', 'rejete');
create type public.moderation_status   as enum ('en_attente', 'approuvee', 'rejetee');
create type public.signal_status       as enum ('envoye', 'accepte', 'refuse', 'expire');
create type public.profile_visibility  as enum ('brouillon', 'en_attente_moderation', 'visible', 'masque');
create type public.report_status       as enum ('nouveau', 'en_cours', 'traite', 'rejete');

-- ---------- users ----------
create table public.users (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 citext not null unique,
  role                  public.user_role not null,
  birth_date            date not null,
  verification_status   public.verification_status not null default 'non_verifie',
  is_moderator          boolean not null default false,
  cgu_accepted_at       timestamptz,
  last_seen_at          timestamptz,
  -- RGPD : suppression différée (30 j) pour permettre l'annulation et la
  -- conservation des logs de modération le temps légal.
  deletion_scheduled_at timestamptz,
  created_at            timestamptz not null default now()
);

comment on column public.users.deletion_scheduled_at is
  'RGPD — date d''effacement définitif programmée. Le compte est invisible dès que ce champ est renseigné.';

-- Vérification d'âge 18+ (section 5) : impossible en CHECK car current_date
-- n''est pas IMMUTABLE, donc trigger.
create or replace function public.enforce_adult_birth_date()
returns trigger
language plpgsql
as $$
begin
  if new.birth_date > (current_date - interval '18 years') then
    raise exception 'Inscription réservée aux personnes majeures (18 ans révolus).'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger users_adult_check
  before insert or update of birth_date on public.users
  for each row execute function public.enforce_adult_birth_date();

-- ---------- profiles ----------
create table public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.users (id) on delete cascade,
  first_name          text not null check (length(btrim(first_name)) between 2 and 40),
  city                text not null,
  lat                 double precision,
  lng                 double precision,
  height_cm           smallint check (height_cm between 120 and 230),
  -- Donnée sensible (RGPD) : nullable et masquée par défaut, cf. section 5.
  nationality         text,
  nationality_visible boolean not null default false,
  languages           text[] not null default '{}',
  bio                 text check (bio is null or length(bio) <= 1000),
  visibility          public.profile_visibility not null default 'brouillon',
  -- Réglages du dashboard femme (écran 9 des maquettes)
  verified_only       boolean not null default false,
  max_distance_km     smallint check (max_distance_km is null or max_distance_km between 1 and 300),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index profiles_visibility_idx on public.profiles (visibility);
create index profiles_city_idx       on public.profiles (lower(city));
create index profiles_geo_idx        on public.profiles (lat, lng);

-- ---------- photos ----------
create table public.photos (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles (id) on delete cascade,
  storage_path      text not null,
  sort_order        smallint not null check (sort_order between 0 and 5),
  -- Aucune photo n'est publique avant passage en 'approuvee' (section 5).
  moderation_status public.moderation_status not null default 'en_attente',
  moderation_scores jsonb,
  moderated_at      timestamptz,
  moderated_by      uuid references public.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (profile_id, sort_order)
);

create index photos_pending_idx on public.photos (created_at)
  where moderation_status = 'en_attente';

-- ---------- interests ----------
create table public.interests (
  slug  text primary key,
  label text not null
);

create table public.profile_interests (
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  interest_slug text not null references public.interests (slug) on delete cascade,
  primary key (profile_id, interest_slug)
);

-- ---------- signals ("signes") ----------
create table public.signals (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.users (id) on delete cascade,
  receiver_id  uuid not null references public.users (id) on delete cascade,
  status       public.signal_status not null default 'envoye',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  expires_at   timestamptz not null default now() + interval '14 days',
  constraint signals_not_self check (sender_id <> receiver_id),
  constraint signals_unique_pair unique (sender_id, receiver_id)
);

create index signals_receiver_idx on public.signals (receiver_id, status, created_at desc);
create index signals_sender_idx   on public.signals (sender_id, status, created_at desc);
create index signals_expiry_idx   on public.signals (expires_at) where status = 'envoye';

-- ---------- conversations & messages ----------
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  signal_id       uuid not null unique references public.signals (id) on delete cascade,
  participant_a   uuid not null references public.users (id) on delete cascade,
  participant_b   uuid not null references public.users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz,
  constraint conversations_distinct check (participant_a <> participant_b)
);

create index conversations_a_idx on public.conversations (participant_a, last_message_at desc nulls last);
create index conversations_b_idx on public.conversations (participant_b, last_message_at desc nulls last);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.users (id) on delete cascade,
  body            text not null check (length(btrim(body)) between 1 and 4000),
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------- favorites / reports / blocks ----------
create table public.favorites (
  user_id    uuid not null references public.users (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, profile_id)
);

create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.users (id) on delete cascade,
  reported_user_id uuid not null references public.users (id) on delete cascade,
  reason           text not null,
  details          text check (details is null or length(details) <= 2000),
  status           public.report_status not null default 'nouveau',
  created_at       timestamptz not null default now(),
  handled_at       timestamptz,
  handled_by       uuid references public.users (id) on delete set null,
  constraint reports_not_self check (reporter_id <> reported_user_id)
);

create index reports_open_idx on public.reports (created_at desc) where status in ('nouveau', 'en_cours');

create table public.blocks (
  user_id         uuid not null references public.users (id) on delete cascade,
  blocked_user_id uuid not null references public.users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (user_id, blocked_user_id),
  constraint blocks_not_self check (user_id <> blocked_user_id)
);

-- ---------- identity_verifications ----------
-- Données sensibles : aucune image n'est stockée en base, seulement la
-- référence de session chez le prestataire tiers + le verdict. Accès
-- réservé au propriétaire et aux modérateurs (cf. 0002_rls.sql).
create table public.identity_verifications (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users (id) on delete cascade,
  provider            text not null,
  provider_session_id text not null,
  status              public.verification_status not null default 'en_cours',
  decided_at          timestamptz,
  -- RGPD : purge automatique de la trace de vérification.
  purge_after         timestamptz not null default now() + interval '90 days',
  created_at          timestamptz not null default now(),
  unique (provider, provider_session_id)
);

create index identity_verifications_user_idx on public.identity_verifications (user_id, created_at desc);

-- ---------- updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- Un signe accepté ouvre une conversation (section 4.3) ----------
create or replace function public.open_conversation_on_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepte' and coalesce(old.status, 'envoye') <> 'accepte' then
    insert into public.conversations (signal_id, participant_a, participant_b)
    values (new.id, new.sender_id, new.receiver_id)
    on conflict (signal_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger signals_open_conversation
  after update of status on public.signals
  for each row execute function public.open_conversation_on_accept();

create or replace function public.touch_conversation_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();
