-- V1.1 : import des données réelles Ticketmaster (étape 2 : base de données).
--
-- - sync_runs : journal de synchronisation (consultable dans Supabase, jamais depuis l'app) ;
-- - genre_mappings : correspondance genres Ticketmaster → genres Vybe (ajustable sans code) ;
-- - events.last_seen_at : dernière synchronisation où l'événement était encore chez la source ;
-- - import_ticketmaster_events(lot) : écrit un lot de concerts (villes, salles, artistes,
--   événements, line-up) en une seule transaction. Réservée au serveur (rôle service_role).
--
-- La fonction serveur (Edge Function sync-ticketmaster, étape 3) appelle l'API, met chaque
-- concert dans le format décrit plus bas, puis appelle import_ticketmaster_events par lots.

-- ---------------------------------------------------------------------------
-- Journal de synchronisation
-- ---------------------------------------------------------------------------

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source public.data_source not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'partial', 'failed')),
  api_calls integer not null default 0 check (api_calls >= 0),
  events_created integer not null default 0 check (events_created >= 0),
  events_updated integer not null default 0 check (events_updated >= 0),
  events_removed integer not null default 0 check (events_removed >= 0),
  errors jsonb not null default '[]'::jsonb,   -- liste de messages d'erreur (tranche, code HTTP…)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sync_runs_started_at_idx on public.sync_runs (started_at desc);

comment on table public.sync_runs is
  'Journal des synchronisations avec les sources externes (V1.1). Non lisible depuis l''app.';

create trigger sync_runs_set_updated_at before update on public.sync_runs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Correspondance des genres (source → genre Vybe)
-- ---------------------------------------------------------------------------

create table public.genre_mappings (
  id uuid primary key default gen_random_uuid(),
  source public.data_source not null,
  external_genre text not null,                -- ex. « Hip-Hop/Rap »
  external_sub_genre text,                     -- facultatif : précise un sous-genre (ex. « French Rap »)
  genre_id uuid not null references public.genres (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- null distinct = non : une seule règle « genre seul » par genre externe.
  unique nulls not distinct (source, external_genre, external_sub_genre)
);

comment on table public.genre_mappings is
  'Correspondance des genres d''une source vers les genres Vybe (V1.1). Un sous-genre l''emporte sur le genre.';

create trigger genre_mappings_set_updated_at before update on public.genre_mappings
  for each row execute function public.set_updated_at();

-- Règles de départ (à ajuster après l'appel de test, sans toucher au code).
insert into public.genre_mappings (source, external_genre, external_sub_genre, genre_id)
select 'ticketmaster', m.external_genre, m.external_sub_genre, g.id
from (values
  ('Hip-Hop/Rap', null, 'rap'),
  ('R&B', null, 'rnb'),
  ('Pop', null, 'pop'),
  ('Dance/Electronic', null, 'electro'),
  ('Chanson Francaise', null, 'chanson'),
  ('French', null, 'chanson')
) as m(external_genre, external_sub_genre, slug)
join public.genres g on g.slug = m.slug
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Suivi de présence des événements chez la source
-- ---------------------------------------------------------------------------

alter table public.events add column last_seen_at timestamptz;

comment on column public.events.last_seen_at is
  'Dernière synchronisation où l''événement figurait encore chez la source (V1.1).';

-- ---------------------------------------------------------------------------
-- Sécurité : aucune lecture ni écriture depuis l'app (RLS activée, aucune politique).
-- ---------------------------------------------------------------------------

alter table public.sync_runs enable row level security;
alter table public.genre_mappings enable row level security;

revoke all on public.sync_runs, public.genre_mappings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Genre Vybe d'un genre / sous-genre de la source (null si aucune règle : jamais de genre inventé)
-- ---------------------------------------------------------------------------

create function public.resolve_genre(p_source public.data_source, p_genre text, p_sub_genre text)
returns uuid
language sql
stable
set search_path = ''
as $$
  select m.genre_id
  from public.genre_mappings m
  where m.source = p_source
    and m.external_genre = p_genre
    and (m.external_sub_genre is null or m.external_sub_genre = p_sub_genre)
  -- La règle la plus précise (avec sous-genre) l'emporte.
  order by (m.external_sub_genre is null)
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Import d'un lot de concerts Ticketmaster
-- ---------------------------------------------------------------------------
--
-- p_events : tableau JSON d'événements déjà mis en forme par la fonction serveur :
-- {
--   "external_id": "G5v…", "name": "…", "type": "concert" | "festival",
--   "status": "announced" | "on_sale" | "sold_out" | "postponed" | "cancelled" | "past",
--   "starts_at": "2026-12-01T19:00:00Z", "time_tba": false, "on_sale_at": null,
--   "ticket_url": "…", "price_min": 35, "price_max": 50, "currency": "EUR", "image_url": "…",
--   "genre": "Hip-Hop/Rap", "sub_genre": "French Rap",
--   "venue": { "external_id": "KovZ…", "name": "…", "address": "…", "postal_code": "…",
--              "latitude": 47.2, "longitude": -1.5, "url": "…",
--              "city": { "name": "Nantes", "country_code": "FR" } } | null,
--   "attractions": [ { "external_id": "K8v…", "name": "…", "image_url": "…", "url": "…",
--                      "genre": "…", "sub_genre": "…" } ]   -- dans l'ordre de l'affiche
-- }
-- p_seen_at : début de la synchronisation (marque les événements vus).
--
-- Règles :
-- - création ou mise à jour par identifiant stable (source, external_id) : jamais de doublon ;
-- - un événement masqué à la main (is_hidden) le reste ;
-- - une donnée absente du lot ne remplace pas une donnée connue (image, coordonnées) ;
-- - line-up : 1er artiste = tête d'affiche, les suivants = premières parties ; les artistes
--   retirés de l'affiche par la source sont retirés du line-up ;
-- - les envies et artistes suivis des utilisateurs ne sont jamais touchés (seul le catalogue change).
--
-- Renvoie {"created": n, "updated": n}.

create function public.import_ticketmaster_events(p_events jsonb, p_seen_at timestamptz default now())
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  e jsonb;
  a jsonb;
  v_city_id uuid;
  v_venue_id uuid;
  v_artist_id uuid;
  v_event_id uuid;
  v_inserted boolean;
  v_artist_ids uuid[];
  v_position smallint;
  v_created integer := 0;
  v_updated integer := 0;
begin
  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'import_ticketmaster_events : un tableau JSON est attendu' using errcode = '22023';
  end if;

  for e in select * from jsonb_array_elements(p_events) loop
    -- Ville et salle (facultatives : un événement sans salle, ou sans ville connue, reste importable).
    v_venue_id := null;
    if jsonb_typeof(e -> 'venue') = 'object'
       and e #>> '{venue,external_id}' is not null
       and e #>> '{venue,city,name}' is not null then
      insert into public.cities (name, country_code, latitude, longitude)
      values (
        e #>> '{venue,city,name}',
        coalesce(e #>> '{venue,city,country_code}', 'FR'),
        (e #>> '{venue,latitude}')::double precision,
        (e #>> '{venue,longitude}')::double precision
      )
      on conflict (name, country_code) do update
        -- Coordonnées d'une ville créée sans position : complétées dès qu'une salle en donne.
        set latitude = coalesce(public.cities.latitude, excluded.latitude),
            longitude = coalesce(public.cities.longitude, excluded.longitude)
      returning id into v_city_id;

      insert into public.venues (name, city_id, address, postal_code, latitude, longitude, url, source, external_id)
      values (
        e #>> '{venue,name}',
        v_city_id,
        e #>> '{venue,address}',
        e #>> '{venue,postal_code}',
        (e #>> '{venue,latitude}')::double precision,
        (e #>> '{venue,longitude}')::double precision,
        e #>> '{venue,url}',
        'ticketmaster',
        e #>> '{venue,external_id}'
      )
      on conflict (source, external_id) do update
        set name = excluded.name,
            city_id = excluded.city_id,
            address = coalesce(excluded.address, public.venues.address),
            postal_code = coalesce(excluded.postal_code, public.venues.postal_code),
            latitude = coalesce(excluded.latitude, public.venues.latitude),
            longitude = coalesce(excluded.longitude, public.venues.longitude),
            url = coalesce(excluded.url, public.venues.url)
      returning id into v_venue_id;
    end if;

    -- Événement (le statut « masqué » posé à la main n'est jamais modifié par l'import).
    insert into public.events (
      name, type, status, venue_id, genre_id, starts_at, time_tba, on_sale_at, ticket_url,
      price_min, price_max, currency, image_url, source, external_id, last_seen_at
    )
    values (
      e ->> 'name',
      coalesce((e ->> 'type')::public.event_type, 'concert'),
      coalesce((e ->> 'status')::public.event_status, 'announced'),
      v_venue_id,
      public.resolve_genre('ticketmaster', e ->> 'genre', e ->> 'sub_genre'),
      (e ->> 'starts_at')::timestamptz,
      coalesce((e ->> 'time_tba')::boolean, false),
      (e ->> 'on_sale_at')::timestamptz,
      e ->> 'ticket_url',
      (e ->> 'price_min')::numeric,
      (e ->> 'price_max')::numeric,
      coalesce(e ->> 'currency', 'EUR'),
      e ->> 'image_url',
      'ticketmaster',
      e ->> 'external_id',
      p_seen_at
    )
    on conflict (source, external_id) do update
      set name = excluded.name,
          type = excluded.type,
          status = excluded.status,
          venue_id = coalesce(excluded.venue_id, public.events.venue_id),
          genre_id = coalesce(excluded.genre_id, public.events.genre_id),
          starts_at = excluded.starts_at,
          time_tba = excluded.time_tba,
          on_sale_at = excluded.on_sale_at,
          ticket_url = excluded.ticket_url,
          price_min = excluded.price_min,
          price_max = excluded.price_max,
          currency = excluded.currency,
          image_url = coalesce(excluded.image_url, public.events.image_url),
          last_seen_at = excluded.last_seen_at
    -- xmax = 0 : la ligne vient d'être insérée (sinon c'est une mise à jour).
    returning id, (xmax = 0) into v_event_id, v_inserted;

    if v_inserted then
      v_created := v_created + 1;
    else
      v_updated := v_updated + 1;
    end if;

    -- Artistes et line-up, dans l'ordre de l'affiche.
    v_artist_ids := '{}';
    v_position := 0;
    for a in select * from jsonb_array_elements(coalesce(e -> 'attractions', '[]'::jsonb)) loop
      insert into public.artists (name, image_url, genre_id, url, source, external_id)
      values (
        a ->> 'name',
        a ->> 'image_url',
        public.resolve_genre('ticketmaster', a ->> 'genre', a ->> 'sub_genre'),
        a ->> 'url',
        'ticketmaster',
        a ->> 'external_id'
      )
      on conflict (source, external_id) do update
        set name = excluded.name,
            image_url = coalesce(excluded.image_url, public.artists.image_url),
            genre_id = coalesce(excluded.genre_id, public.artists.genre_id),
            url = coalesce(excluded.url, public.artists.url)
      returning id into v_artist_id;

      -- Un artiste listé deux fois par la source n'est compté qu'une fois.
      if not v_artist_id = any (v_artist_ids) then
        insert into public.event_artists (event_id, artist_id, role, position)
        values (
          v_event_id,
          v_artist_id,
          case when v_position = 0 then 'headliner'::public.artist_role else 'support'::public.artist_role end,
          v_position
        )
        on conflict (event_id, artist_id) do update
          set role = excluded.role,
              position = excluded.position;
        v_artist_ids := v_artist_ids || v_artist_id;
        v_position := v_position + 1;
      end if;
    end loop;

    -- Artistes retirés de l'affiche par la source.
    delete from public.event_artists
    where event_id = v_event_id
      and not (artist_id = any (v_artist_ids));
  end loop;

  return jsonb_build_object('created', v_created, 'updated', v_updated);
end;
$$;

comment on function public.import_ticketmaster_events(jsonb, timestamptz) is
  'Écrit un lot de concerts Ticketmaster (villes, salles, artistes, événements, line-up) en une transaction. Serveur uniquement.';

-- Réservées au serveur : ni l'app (anon, authenticated) ni personne d'autre ne peut les appeler.
revoke execute on function public.import_ticketmaster_events(jsonb, timestamptz) from public, anon, authenticated;
revoke execute on function public.resolve_genre(public.data_source, text, text) from public, anon, authenticated;
grant execute on function public.import_ticketmaster_events(jsonb, timestamptz) to service_role;
grant execute on function public.resolve_genre(public.data_source, text, text) to service_role;
grant select, insert, update on public.sync_runs to service_role;
grant select on public.genre_mappings to service_role;
