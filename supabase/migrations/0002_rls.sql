-- =====================================================================
-- Meet X — v1 : Row Level Security
-- Règle directrice : un client (clé anon) ne doit jamais pouvoir lire ce
-- qu'un membre ne verrait pas dans l'interface. En particulier, un refus
-- de signe reste invisible pour l'expéditeur (section 4.2).
-- =====================================================================

alter table public.users                  enable row level security;
alter table public.profiles               enable row level security;
alter table public.photos                 enable row level security;
alter table public.interests              enable row level security;
alter table public.profile_interests      enable row level security;
alter table public.signals                enable row level security;
alter table public.conversations          enable row level security;
alter table public.messages               enable row level security;
alter table public.favorites              enable row level security;
alter table public.reports                enable row level security;
alter table public.blocks                 enable row level security;
alter table public.identity_verifications enable row level security;

-- ---------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select u.is_moderator from public.users u where u.id = auth.uid()), false);
$$;

-- Membre « actif » : compte majeur, CGU acceptées, pas en cours de suppression.
create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
     where u.id = auth.uid()
       and u.cgu_accepted_at is not null
       and u.deletion_scheduled_at is null
       and u.birth_date <= (current_date - interval '18 years')
  );
$$;

create or replace function public.is_verified_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
     where u.id = auth.uid() and u.verification_status = 'verifie'
  );
$$;

-- Blocage dans un sens ou dans l'autre : la relation disparaît des deux côtés.
create or replace function public.has_block(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
     where (user_id = a and blocked_user_id = b)
        or (user_id = b and blocked_user_id = a)
  );
$$;

-- Un membre existe-t-il encore (pas de suppression RGPD programmée) ?
-- Passe par une fonction SECURITY DEFINER : une sous-requête sur public.users
-- depuis une policy hériterait de la RLS de users et ne verrait que soi-même.
create or replace function public.member_active(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u where u.id = uid and u.deletion_scheduled_at is null
  );
$$;

-- Contexte de service (cron, webhooks, migrations) : ces rôles ne sont pas
-- soumis aux garde-fous « anti auto-promotion » destinés aux clients.
create or replace function public.is_service_context()
returns boolean language sql stable as $$
  select current_user in ('postgres', 'service_role', 'supabase_admin', 'supabase_auth_admin');
$$;

-- Âge et statut de vérification exposés sans divulguer la date de naissance
-- ni l'e-mail (la table users reste privée).
create or replace function public.member_age(uid uuid)
returns integer language sql stable security definer set search_path = public as $$
  select date_part('year', age(current_date, u.birth_date))::int
    from public.users u where u.id = uid;
$$;

create or replace function public.member_verification(uid uuid)
returns public.verification_status language sql stable security definer set search_path = public as $$
  select u.verification_status from public.users u where u.id = uid;
$$;

create or replace function public.member_role(uid uuid)
returns public.user_role language sql stable security definer set search_path = public as $$
  select u.role from public.users u where u.id = uid;
$$;

-- « En ligne » = vu il y a moins de 10 minutes. Expose un booléen, jamais
-- l'horodatage exact de dernière connexion.
create or replace function public.member_online(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select u.last_seen_at > now() - interval '10 minutes'
                     from public.users u where u.id = uid), false);
$$;

-- Badge « % d'accords » (section 6 : remplace la notation par étoiles).
-- Renvoie null tant que l'échantillon est trop petit pour être signifiant.
create or replace function public.acceptance_rate(uid uuid)
returns integer language sql stable security definer set search_path = public as $$
  select case
           when count(*) filter (where status in ('accepte', 'refuse')) >= 5
           then round(100.0 * count(*) filter (where status = 'accepte')
                            / nullif(count(*) filter (where status in ('accepte', 'refuse')), 0))::int
         end
    from public.signals where receiver_id = uid;
$$;

grant execute on function
  public.is_moderator(), public.is_active_member(), public.is_verified_member(),
  public.has_block(uuid, uuid), public.member_age(uuid),
  public.member_verification(uuid), public.member_role(uuid),
  public.member_online(uuid), public.acceptance_rate(uuid),
  public.member_active(uuid), public.is_service_context()
  to anon, authenticated;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
create policy users_select_self on public.users
  for select using (id = auth.uid() or public.is_moderator());

create policy users_insert_self on public.users
  for insert with check (id = auth.uid());

create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy users_moderator_update on public.users
  for update using (public.is_moderator()) with check (public.is_moderator());

-- Un membre ne peut pas s'auto-promouvoir ni s'auto-vérifier.
-- SECURITY INVOKER volontairement : le garde-fou doit voir le rôle réel de
-- l'appelant (authenticated / service_role), qu'un SECURITY DEFINER masquerait.
create or replace function public.protect_privileged_user_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.is_moderator() or public.is_service_context() then
    return new;  -- modérateur, ou service_role / cron / migration
  end if;
  if new.is_moderator is distinct from old.is_moderator
     or new.verification_status is distinct from old.verification_status
     or new.role is distinct from old.role
     or new.birth_date is distinct from old.birth_date
     or new.email is distinct from old.email then
    raise exception 'Champ protégé : rôle, âge, e-mail et statut de vérification ne sont pas modifiables depuis le client.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger users_protect_columns
  before update on public.users
  for each row execute function public.protect_privileged_user_columns();

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy profiles_select_own on public.profiles
  for select using (user_id = auth.uid() or public.is_moderator());

create policy profiles_select_visible on public.profiles
  for select using (
    visibility = 'visible'
    and public.is_active_member()
    and not public.has_block(auth.uid(), user_id)
    and public.member_active(user_id)
    and (verified_only = false or public.is_verified_member())
  );

create policy profiles_insert_own on public.profiles
  for insert with check (user_id = auth.uid());

create policy profiles_update_own on public.profiles
  for update using (user_id = auth.uid() or public.is_moderator())
  with check (user_id = auth.uid() or public.is_moderator());

-- Publication : jamais directement en 'visible' depuis le client, et jamais
-- pour un profil femme non vérifié (section 5).
-- SECURITY INVOKER volontairement : le garde-fou doit voir le rôle réel de
-- l'appelant (authenticated / service_role), qu'un SECURITY DEFINER masquerait.
create or replace function public.enforce_publication_rules()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.is_moderator() or public.is_service_context() then
    return new;
  end if;
  if new.visibility = 'visible'
     and coalesce(old.visibility, 'brouillon') not in ('visible', 'masque') then
    raise exception 'Un profil passe en ligne après revue de modération, pas directement.'
      using errcode = 'insufficient_privilege';
  end if;
  if new.visibility in ('visible', 'en_attente_moderation')
     and public.member_role(new.user_id) = 'femme'
     and public.member_verification(new.user_id) <> 'verifie' then
    raise exception 'Vérification d''identité requise avant publication du profil.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger profiles_publication_rules
  before insert or update on public.profiles
  for each row execute function public.enforce_publication_rules();

-- Vue publique : masque la nationalité tant qu'elle n'est pas opt-in, et
-- calcule l'âge sans exposer la date de naissance. security_invoker = on ⇒
-- les policies de public.profiles ci-dessus s'appliquent au lecteur.
create view public.profiles_public with (security_invoker = on) as
  select p.id,
         p.user_id,
         p.first_name,
         p.city,
         p.lat,
         p.lng,
         p.height_cm,
         case when p.nationality_visible then p.nationality end as nationality,
         p.languages,
         p.bio,
         p.visibility,
         p.created_at,
         public.member_age(p.user_id)          as age,
         public.member_verification(p.user_id) as verification_status,
         public.member_role(p.user_id)         as role,
         public.member_online(p.user_id)       as online,
         public.acceptance_rate(p.user_id)     as acceptance_rate
    from public.profiles p;

grant select on public.profiles_public to anon, authenticated;

-- ---------------------------------------------------------------------
-- photos — rien n'est public avant 'approuvee'
-- ---------------------------------------------------------------------
create policy photos_select_own on public.photos
  for select using (
    public.is_moderator()
    or exists (select 1 from public.profiles p
                where p.id = photos.profile_id and p.user_id = auth.uid())
  );

create policy photos_select_approved on public.photos
  for select using (
    moderation_status = 'approuvee'
    -- La sous-requête hérite des policies de profiles : si le profil n'est
    -- pas visible pour ce lecteur, la photo ne l'est pas non plus.
    and exists (select 1 from public.profiles p where p.id = photos.profile_id)
  );

create policy photos_write_own on public.photos
  for insert with check (
    exists (select 1 from public.profiles p
             where p.id = photos.profile_id and p.user_id = auth.uid())
  );

create policy photos_update_own on public.photos
  for update using (
    public.is_moderator()
    or exists (select 1 from public.profiles p
                where p.id = photos.profile_id and p.user_id = auth.uid())
  ) with check (
    public.is_moderator()
    or exists (select 1 from public.profiles p
                where p.id = photos.profile_id and p.user_id = auth.uid())
  );

create policy photos_delete_own on public.photos
  for delete using (
    public.is_moderator()
    or exists (select 1 from public.profiles p
                where p.id = photos.profile_id and p.user_id = auth.uid())
  );

-- Un membre ne peut pas approuver ses propres photos.
-- SECURITY INVOKER volontairement : le garde-fou doit voir le rôle réel de
-- l'appelant (authenticated / service_role), qu'un SECURITY DEFINER masquerait.
create or replace function public.protect_photo_moderation()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.is_moderator() or public.is_service_context() then
    return new;
  end if;
  if new.moderation_status is distinct from old.moderation_status then
    raise exception 'Le statut de modération est réservé à l''équipe de modération.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger photos_protect_moderation
  before update on public.photos
  for each row execute function public.protect_photo_moderation();

-- ---------------------------------------------------------------------
-- interests (référentiel en lecture seule)
-- ---------------------------------------------------------------------
create policy interests_read on public.interests for select using (true);

create policy profile_interests_read on public.profile_interests
  for select using (
    exists (select 1 from public.profiles p where p.id = profile_interests.profile_id)
  );

create policy profile_interests_write on public.profile_interests
  for all using (
    exists (select 1 from public.profiles p
             where p.id = profile_interests.profile_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.profiles p
             where p.id = profile_interests.profile_id and p.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- signals — le refus est silencieux
-- ---------------------------------------------------------------------
-- L'expéditeur ne voit jamais la ligne 'refuse'.
create policy signals_select_sender on public.signals
  for select using (sender_id = auth.uid() and status <> 'refuse');

create policy signals_select_receiver on public.signals
  for select using (receiver_id = auth.uid() or public.is_moderator());

-- Pas d'INSERT direct : l'envoi passe par public.send_signal() qui reste
-- silencieux si un refus existe déjà (sinon la violation de contrainte
-- d'unicité révélerait le refus).
create policy signals_update_receiver on public.signals
  for update using (receiver_id = auth.uid() and status = 'envoye')
  with check (receiver_id = auth.uid() and status in ('accepte', 'refuse'));

create or replace function public.send_signal(target uuid)
returns public.signal_status
language plpgsql security definer set search_path = public as $$
declare
  me       uuid := auth.uid();
  existing public.signals%rowtype;
begin
  if me is null or not public.is_active_member() then
    raise exception 'Compte requis pour envoyer un signe.' using errcode = 'insufficient_privilege';
  end if;
  if target = me then
    raise exception 'Impossible de s''envoyer un signe à soi-même.' using errcode = 'check_violation';
  end if;
  if public.has_block(me, target) then
    -- Silence également en cas de blocage : aucune information renvoyée.
    return 'envoye';
  end if;
  if not exists (
    select 1 from public.profiles p
     where p.user_id = target
       and p.visibility = 'visible'
       and public.member_active(p.user_id)
       and (p.verified_only = false or public.is_verified_member())
  ) then
    raise exception 'Ce profil n''accepte pas de signe.' using errcode = 'check_violation';
  end if;

  select * into existing from public.signals
   where sender_id = me and receiver_id = target;

  if not found then
    insert into public.signals (sender_id, receiver_id) values (me, target);
    return 'envoye';
  end if;

  if existing.status = 'expire' then
    update public.signals
       set status = 'envoye', created_at = now(), responded_at = null,
           expires_at = now() + interval '14 days'
     where id = existing.id;
    return 'envoye';
  end if;

  -- 'refuse' → on ne relance pas, et on ne le dit pas.
  if existing.status = 'refuse' then
    return 'envoye';
  end if;

  return existing.status;
end;
$$;

revoke all on function public.send_signal(uuid) from public;
grant execute on function public.send_signal(uuid) to authenticated;

-- Vue « signes envoyés » : un refus continue d'apparaître comme « en attente »
-- jusqu'à la date d'expiration normale, pour que le silence tienne dans le
-- temps et pas seulement à l'instant du refus.
create view public.signals_sent as
  select s.id,
         s.receiver_id,
         s.created_at,
         s.expires_at,
         case when s.status = 'refuse' then 'envoye'::public.signal_status else s.status end as status
    from public.signals s
   where s.sender_id = auth.uid()
     and s.status <> 'expire'
     and (s.status <> 'refuse' or s.expires_at > now());

revoke all on public.signals_sent from anon;
grant select on public.signals_sent to authenticated;

-- ---------------------------------------------------------------------
-- conversations & messages — accès strictement aux deux participants
-- ---------------------------------------------------------------------
create policy conversations_select_participants on public.conversations
  for select using (participant_a = auth.uid() or participant_b = auth.uid());

create policy messages_select_participants on public.messages
  for select using (
    exists (select 1 from public.conversations c
             where c.id = messages.conversation_id
               and (c.participant_a = auth.uid() or c.participant_b = auth.uid()))
  );

create policy messages_insert_participants on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
       where c.id = messages.conversation_id
         and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
         and not public.has_block(c.participant_a, c.participant_b)
    )
  );

-- Accusé de lecture : seul le destinataire marque le message comme lu.
create policy messages_update_read on public.messages
  for update using (
    sender_id <> auth.uid()
    and exists (select 1 from public.conversations c
                 where c.id = messages.conversation_id
                   and (c.participant_a = auth.uid() or c.participant_b = auth.uid()))
  ) with check (sender_id <> auth.uid());

-- ---------------------------------------------------------------------
-- favorites / reports / blocks
-- ---------------------------------------------------------------------
create policy favorites_own on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reports_insert on public.reports
  for insert with check (reporter_id = auth.uid());

create policy reports_select on public.reports
  for select using (reporter_id = auth.uid() or public.is_moderator());

create policy reports_update_moderator on public.reports
  for update using (public.is_moderator()) with check (public.is_moderator());

create policy blocks_own on public.blocks
  for all using (user_id = auth.uid() or public.is_moderator())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- identity_verifications — lecture seule côté membre, écriture service_role
-- ---------------------------------------------------------------------
create policy identity_select_own on public.identity_verifications
  for select using (user_id = auth.uid() or public.is_moderator());
