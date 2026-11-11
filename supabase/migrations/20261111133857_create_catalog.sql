-- Vybe — Catalogue : genres, villes, salles, artistes, événements.
-- Conçu pour le MVP (données de démonstration) et pour les versions suivantes :
-- Ticketmaster (V1.1), événements créés par un utilisateur (V1.5), festivals (V2.3).
-- La table user_events (V1.3) n'est volontairement PAS créée ici.

-- ---------------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------------

create type public.event_type as enum ('concert', 'festival');

create type public.event_status as enum (
  'announced',  -- annoncé
  'on_sale',    -- billetterie ouverte
  'sold_out',   -- complet
  'postponed',  -- reporté
  'cancelled',  -- annulé
  'past'        -- passé
);

create type public.artist_role as enum ('headliner', 'support', 'guest', 'co_headliner');

-- Origine d'une donnée. D'autres sources pourront être ajoutées (alter type ... add value).
create type public.data_source as enum ('demo', 'ticketmaster', 'user');

-- ---------------------------------------------------------------------------
-- Mise à jour automatique de updated_at
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Genres
-- ---------------------------------------------------------------------------

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,            -- identifiant stable, ex. « rap »
  name text not null,                   -- libellé affiché, ex. « Rap »
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.genres is 'Genres musicaux de l''application (les genres Ticketmaster y seront rattachés en V1.1).';

-- ---------------------------------------------------------------------------
-- Villes
-- ---------------------------------------------------------------------------

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code char(2) not null default 'FR',  -- code ISO 3166-1
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, country_code)
);

comment on table public.cities is 'Villes des salles de concert.';

-- ---------------------------------------------------------------------------
-- Salles
-- ---------------------------------------------------------------------------

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city_id uuid not null references public.cities (id) on delete restrict,
  address text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  url text,
  source public.data_source not null,
  external_id text,                     -- identifiant chez la source (ex. ID Ticketmaster)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id),
  -- Une source externe fournit toujours un identifiant ; une saisie utilisateur n'en a pas.
  constraint venues_external_id_check check ((source = 'user') = (external_id is null))
);

create index venues_city_id_idx on public.venues (city_id);

comment on table public.venues is 'Salles de concert (Ticketmaster : venues).';

-- ---------------------------------------------------------------------------
-- Artistes
-- ---------------------------------------------------------------------------

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  genre_id uuid references public.genres (id) on delete set null,  -- genre principal
  url text,
  source public.data_source not null,
  external_id text,                     -- identifiant chez la source (Ticketmaster : attraction id)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id),
  constraint artists_external_id_check check ((source = 'user') = (external_id is null))
);

create index artists_genre_id_idx on public.artists (genre_id);

comment on table public.artists is 'Artistes (Ticketmaster : attractions).';

-- ---------------------------------------------------------------------------
-- Événements
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.event_type not null default 'concert',
  status public.event_status not null default 'announced',
  venue_id uuid references public.venues (id) on delete restrict,
  genre_id uuid references public.genres (id) on delete set null,
  starts_at timestamptz not null,
  time_tba boolean not null default false,       -- heure pas encore annoncée
  timezone text not null default 'Europe/Paris',
  on_sale_at timestamptz,                        -- ouverture de la billetterie
  ticket_url text,
  price_min numeric(10, 2),
  price_max numeric(10, 2),
  currency char(3) not null default 'EUR',
  description text,
  image_url text,
  source public.data_source not null,
  external_id text,
  created_by uuid references auth.users (id) on delete cascade,  -- auteur d'un événement saisi à la main (V1.5)
  is_hidden boolean not null default false,      -- masquage manuel depuis le tableau de bord
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id),
  -- Source externe : identifiant obligatoire, pas d'auteur. Saisie utilisateur : l'inverse.
  constraint events_source_check check (
    (source = 'user' and external_id is null and created_by is not null)
    or (source <> 'user' and external_id is not null and created_by is null)
  ),
  constraint events_price_check check (
    (price_min is null or price_min >= 0)
    and (price_max is null or price_max >= 0)
    and (price_min is null or price_max is null or price_min <= price_max)
  )
);

create index events_starts_at_idx on public.events (starts_at);
create index events_venue_id_idx on public.events (venue_id);
create index events_genre_id_idx on public.events (genre_id);
create index events_created_by_idx on public.events (created_by);

comment on table public.events is 'Concerts et festivals (seuls les concerts sont affichés avant la V2.3).';
comment on column public.events.is_hidden is 'Coché depuis le tableau de bord pour masquer un événement erroné.';

-- ---------------------------------------------------------------------------
-- Liaison événement – artistes
-- ---------------------------------------------------------------------------

create table public.event_artists (
  event_id uuid not null references public.events (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  role public.artist_role not null default 'headliner',
  position smallint not null default 0,  -- ordre d'apparition sur l'affiche
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, artist_id)
);

create index event_artists_artist_id_idx on public.event_artists (artist_id);

comment on table public.event_artists is 'Programmation d''un événement : artistes et leur rôle.';

-- ---------------------------------------------------------------------------
-- Déclencheurs updated_at
-- ---------------------------------------------------------------------------

create trigger genres_set_updated_at before update on public.genres
  for each row execute function public.set_updated_at();
create trigger cities_set_updated_at before update on public.cities
  for each row execute function public.set_updated_at();
create trigger venues_set_updated_at before update on public.venues
  for each row execute function public.set_updated_at();
create trigger artists_set_updated_at before update on public.artists
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger event_artists_set_updated_at before update on public.event_artists
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sécurité : Row Level Security
-- Au MVP : lecture publique du catalogue, aucune écriture depuis l'application.
-- ---------------------------------------------------------------------------

alter table public.genres enable row level security;
alter table public.cities enable row level security;
alter table public.venues enable row level security;
alter table public.artists enable row level security;
alter table public.events enable row level security;
alter table public.event_artists enable row level security;

create policy "Lecture publique des genres" on public.genres
  for select to anon, authenticated using (true);
create policy "Lecture publique des villes" on public.cities
  for select to anon, authenticated using (true);
create policy "Lecture publique des salles" on public.venues
  for select to anon, authenticated using (true);
create policy "Lecture publique des artistes" on public.artists
  for select to anon, authenticated using (true);
create policy "Lecture publique des événements visibles" on public.events
  for select to anon, authenticated using (not is_hidden);
create policy "Lecture publique de la programmation" on public.event_artists
  for select to anon, authenticated using (true);

-- Double protection : en plus de l'absence de règle d'écriture, on retire les droits
-- d'écriture aux rôles utilisés par l'application.
revoke insert, update, delete, truncate
  on public.genres, public.cities, public.venues, public.artists, public.events, public.event_artists
  from anon, authenticated;
