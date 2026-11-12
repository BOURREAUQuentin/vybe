-- Vybe — V1.3 : données des utilisateurs (envies, suivis, favoris, préférences).
--
-- Règles (CLAUDE.md, règles 4 et 7) :
-- - chaque ligne appartient à un utilisateur (user_id = son identifiant Supabase Auth) ;
-- - un utilisateur connecté ne lit et n'écrit QUE ses propres lignes (RLS) ;
-- - les visiteurs non connectés n'ont aucun accès à ces tables ;
-- - supprimer le compte supprime toutes ses lignes (on delete cascade).

-- ---------------------------------------------------------------------------
-- Type énuméré
-- ---------------------------------------------------------------------------

create type public.user_event_status as enum (
  'wishlist', -- envie d'y aller (V1.3)
  'going',    -- j'y vais (V1.5)
  'attended'  -- j'y étais (V1.5)
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Événements de l'utilisateur : table unique avec un statut (liste d'envies, puis agenda et historique).
create table public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  status public.user_event_status not null default 'wishlist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create index user_events_event_id_idx on public.user_events (event_id);

-- Artistes suivis.
create table public.user_artist_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, artist_id)
);

create index user_artist_follows_artist_id_idx on public.user_artist_follows (artist_id);

-- Salles favorites.
create table public.user_venue_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  venue_id uuid not null references public.venues (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, venue_id)
);

create index user_venue_follows_venue_id_idx on public.user_venue_follows (venue_id);

-- Villes favorites, dont au plus une ville principale (alimente « Près de chez toi »).
create table public.user_favorite_cities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  city_id uuid not null references public.cities (id) on delete cascade,
  is_main boolean not null default false,
  radius_km smallint not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, city_id),
  constraint user_favorite_cities_radius_check check (radius_km between 1 and 500)
);

create index user_favorite_cities_city_id_idx on public.user_favorite_cities (city_id);
-- Une seule ville principale par utilisateur, garanti par la base.
create unique index user_favorite_cities_one_main_idx
  on public.user_favorite_cities (user_id) where is_main;

-- Genres préférés.
create table public.user_genre_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, genre_id)
);

create index user_genre_preferences_genre_id_idx on public.user_genre_preferences (genre_id);

comment on table public.user_events is 'Concerts enregistrés par un utilisateur, avec un statut (envie, j''y vais, j''y étais).';
comment on table public.user_artist_follows is 'Artistes suivis par un utilisateur.';
comment on table public.user_venue_follows is 'Salles favorites d''un utilisateur.';
comment on table public.user_favorite_cities is 'Villes favorites d''un utilisateur ; au plus une ville principale.';
comment on table public.user_genre_preferences is 'Genres musicaux préférés d''un utilisateur.';

-- ---------------------------------------------------------------------------
-- Déclencheurs updated_at (fonction créée par la migration du catalogue)
-- ---------------------------------------------------------------------------

create trigger user_events_set_updated_at before update on public.user_events
  for each row execute function public.set_updated_at();
create trigger user_artist_follows_set_updated_at before update on public.user_artist_follows
  for each row execute function public.set_updated_at();
create trigger user_venue_follows_set_updated_at before update on public.user_venue_follows
  for each row execute function public.set_updated_at();
create trigger user_favorite_cities_set_updated_at before update on public.user_favorite_cities
  for each row execute function public.set_updated_at();
create trigger user_genre_preferences_set_updated_at before update on public.user_genre_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sécurité : Row Level Security — chacun ne voit et ne modifie que ses lignes.
-- (select auth.uid()) est évalué une seule fois par requête (recommandation Supabase).
-- ---------------------------------------------------------------------------

alter table public.user_events enable row level security;
alter table public.user_artist_follows enable row level security;
alter table public.user_venue_follows enable row level security;
alter table public.user_favorite_cities enable row level security;
alter table public.user_genre_preferences enable row level security;

create policy "Chacun gère ses propres envies et événements" on public.user_events
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Chacun gère ses propres artistes suivis" on public.user_artist_follows
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Chacun gère ses propres salles favorites" on public.user_venue_follows
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Chacun gère ses propres villes favorites" on public.user_favorite_cities
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Chacun gère ses propres genres préférés" on public.user_genre_preferences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Double protection : aucun droit pour les visiteurs non connectés.
revoke all
  on public.user_events, public.user_artist_follows, public.user_venue_follows,
     public.user_favorite_cities, public.user_genre_preferences
  from anon;

-- ---------------------------------------------------------------------------
-- Suppression du compte depuis l'application (RGPD, droit à l'effacement).
-- Supprime UNIQUEMENT le compte de l'utilisateur connecté (aucun paramètre) ;
-- toutes ses données suivent par cascade. security definer : nécessaire pour
-- supprimer dans auth.users, d'où le search_path verrouillé et l'accès restreint.
-- ---------------------------------------------------------------------------

create function public.delete_my_account()
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

  delete from auth.users where id = current_user_id;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

comment on function public.delete_my_account() is 'Supprime le compte de l''utilisateur connecté et toutes ses données (cascade).';
