-- Vybe — V1.4 : notifications (étape 3, base de données).
--
-- Trois tables utilisateur (CLAUDE.md, règles 4 et 7 ; docs/v1.4.md) :
-- - user_push_tokens : téléphones qui acceptent les notifications (jeton Expo) ;
-- - user_notification_settings : un interrupteur par type de notification ;
-- - notification_log : journal des notifications (anti-doublon), écrit par le serveur seul.
-- Chacun ne voit que ses lignes ; tout est supprimé avec le compte (on delete cascade).

-- ---------------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------------

create type public.notification_kind as enum (
  'followed_artist', -- nouveau concert d'un artiste suivi
  'favorite_city',   -- nouveau concert dans une ville favorite
  'favorite_venue',  -- nouveau concert dans une salle favorite
  'wishlist_change'  -- billetterie ouverte, report, annulation ou date changée d'une envie
);

create type public.notification_status as enum (
  'pending', -- à envoyer (prochain récapitulatif)
  'sent',    -- remise au service d'envoi (Expo Push)
  'failed',  -- refusée par le service d'envoi
  'skipped'  -- non envoyée (type désactivé, aucun téléphone, concert annulé entre-temps…)
);

-- ---------------------------------------------------------------------------
-- Jetons de notification
-- ---------------------------------------------------------------------------

create table public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Jeton Expo du téléphone : un téléphone n'appartient qu'à un compte à la fois.
  token text not null unique,
  platform text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_push_tokens_token_check
    check (length(token) <= 200 and token ~ '^Expo(nent)?PushToken\[[^]]+\]$'),
  constraint user_push_tokens_platform_check check (platform in ('android', 'ios'))
);

create index user_push_tokens_user_id_idx on public.user_push_tokens (user_id);

comment on table public.user_push_tokens is
  'Jetons de notification (Expo) des téléphones d''un utilisateur. Donnée personnelle (RGPD).';

-- ---------------------------------------------------------------------------
-- Réglages : sans ligne, tout est activé (rien ne part sans jeton, donc sans accord du téléphone).
-- ---------------------------------------------------------------------------

create table public.user_notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  followed_artist boolean not null default true,
  favorite_city boolean not null default true,
  favorite_venue boolean not null default true,
  wishlist_change boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_notification_settings is
  'Réglages des notifications d''un utilisateur : un interrupteur par type (absence de ligne = tout activé).';

-- ---------------------------------------------------------------------------
-- Journal : une ligne par raison de prévenir quelqu'un. L'unicité rend tout doublon impossible.
-- ---------------------------------------------------------------------------

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind public.notification_kind not null,
  event_id uuid not null references public.events (id) on delete cascade,
  -- Précision : vide pour un nouveau concert ; pour un changement, « status:on_sale »,
  -- « status:postponed », « status:cancelled » ou « date:<nouvelle date> » (un nouveau report
  -- est une nouvelle raison de prévenir, le même report ne l'est pas).
  detail text not null default '',
  status public.notification_status not null default 'pending',
  -- Remplis à l'envoi : texte envoyé, identifiant de suivi Expo, erreur éventuelle.
  title text,
  body text,
  push_ticket_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, event_id, detail)
);

create index notification_log_pending_idx on public.notification_log (user_id) where status = 'pending';
create index notification_log_event_id_idx on public.notification_log (event_id);
create index notification_log_created_at_idx on public.notification_log (created_at);

comment on table public.notification_log is
  'Journal des notifications (anti-doublon), écrit uniquement par le serveur ; purgé après 30 jours.';

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create trigger user_push_tokens_set_updated_at before update on public.user_push_tokens
  for each row execute function public.set_updated_at();
create trigger user_notification_settings_set_updated_at before update on public.user_notification_settings
  for each row execute function public.set_updated_at();
create trigger notification_log_set_updated_at before update on public.notification_log
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sécurité (RLS)
-- ---------------------------------------------------------------------------

alter table public.user_push_tokens enable row level security;
alter table public.user_notification_settings enable row level security;
alter table public.notification_log enable row level security;

-- Jetons : lecture et suppression de ses propres jetons. L'enregistrement passe par
-- register_push_token (un jeton peut changer de compte sur un même téléphone).
create policy "Chacun voit ses propres jetons" on public.user_push_tokens
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Chacun supprime ses propres jetons" on public.user_push_tokens
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Chacun gère ses propres réglages de notifications" on public.user_notification_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Journal : lecture seule de ses propres lignes (export RGPD) ; aucune écriture depuis l'app.
create policy "Chacun voit ses propres notifications" on public.notification_log
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Double protection : droits limités au strict nécessaire.
revoke all on public.user_push_tokens, public.user_notification_settings, public.notification_log from anon;
revoke insert, update, truncate, references, trigger on public.user_push_tokens from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.notification_log from authenticated;

-- ---------------------------------------------------------------------------
-- Enregistrement d'un jeton par l'app.
-- security definer : si un autre compte s'était connecté avant sur ce téléphone, le jeton lui
-- appartient encore et la RLS empêcherait de le reprendre. La fonction ne touche qu'au jeton
-- reçu (que l'appelant détient, puisqu'il vient de son téléphone) et le rattache au compte
-- connecté : l'ancien compte ne recevra plus les notifications de ce téléphone.
-- ---------------------------------------------------------------------------

create function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Aucun utilisateur connecté.' using errcode = '42501';
  end if;

  insert into public.user_push_tokens (user_id, token, platform)
  values (current_user_id, p_token, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();
end;
$$;

revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

comment on function public.register_push_token(text, text) is
  'Rattache le jeton de notification de ce téléphone au compte connecté (le reprend à un ancien compte).';
