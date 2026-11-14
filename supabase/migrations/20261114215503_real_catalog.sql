-- V1.1, étape 6a : l'app passe au catalogue réel (plus de 5 000 concerts Ticketmaster).
--
-- 1. La démonstration est masquée (concerts, artistes, salles) : colonne is_hidden ajoutée aux
--    artistes et aux salles. Réactivable pour le développement :
--      update public.events set is_hidden = false where source = 'demo';   (idem artists, venues)
-- 2. Les artistes suivis dans la démo sont transférés vers l'artiste Ticketmaster de même nom.
-- 3. Les listes du catalogue ignorent les concerts retirés par la source (withdrawn_at).
-- 4. Requêtes ciblées pour Découvrir et la Recherche (au lieu des « 100 prochains concerts »).
-- 5. filter_events n'a plus de limite fixe : l'app pagine (« Voir plus ») et lit le total.

-- ---------------------------------------------------------------------------
-- 1. Masquage des artistes et des salles
-- ---------------------------------------------------------------------------

alter table public.artists add column is_hidden boolean not null default false;
alter table public.venues add column is_hidden boolean not null default false;

comment on column public.artists.is_hidden is 'Masqué du catalogue (V1.1 : données de démonstration).';
comment on column public.venues.is_hidden is 'Masquée du catalogue (V1.1 : données de démonstration).';

drop policy "Lecture publique des artistes" on public.artists;
create policy "Lecture publique des artistes visibles" on public.artists
  for select to anon, authenticated using (not is_hidden);

drop policy "Lecture publique des salles" on public.venues;
create policy "Lecture publique des salles visibles" on public.venues
  for select to anon, authenticated using (not is_hidden);

-- ---------------------------------------------------------------------------
-- 2. Transfert des artistes suivis (démo → Ticketmaster, même nom sans accents ni casse)
-- ---------------------------------------------------------------------------

with matches as (
  select distinct on (demo.id) demo.id as demo_id, tm.id as tm_id
  from public.artists demo
  join public.artists tm
    on tm.source = 'ticketmaster'
   and public.normalize_search(tm.name) = public.normalize_search(demo.name)
  where demo.source = 'demo'
  order by demo.id, tm.created_at
),
moved as (
  insert into public.user_artist_follows (user_id, artist_id, created_at)
  select f.user_id, m.tm_id, f.created_at
  from public.user_artist_follows f
  join matches m on m.demo_id = f.artist_id
  on conflict (user_id, artist_id) do nothing
  returning user_id
)
delete from public.user_artist_follows f
using matches m
where f.artist_id = m.demo_id;

-- ---------------------------------------------------------------------------
-- 1 bis. La démonstration est masquée (rien n'est supprimé)
-- ---------------------------------------------------------------------------

update public.events set is_hidden = true where source = 'demo';
update public.artists set is_hidden = true where source = 'demo';
update public.venues set is_hidden = true where source = 'demo';

-- ---------------------------------------------------------------------------
-- 3 et 5. Filtres et recherche : concerts retirés ignorés, pagination côté app
-- ---------------------------------------------------------------------------

create or replace function public.filter_events(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_city_id uuid default null,
  p_genre_ids uuid[] default null,
  p_radius_km double precision default null,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns setof public.events
language sql
stable
security invoker
set search_path = ''
as $$
  with reference as (
    select
      coalesce(p_latitude, c.latitude) as latitude,
      coalesce(p_longitude, c.longitude) as longitude,
      case when p_radius_km between 1 and 500 then p_radius_km end as radius_km
    from (select 1) as one
    left join public.cities c on c.id = p_city_id
  )
  select e.*
  from public.events e
  cross join reference r
  left join public.venues v on v.id = e.venue_id
  where e.type = 'concert'
    and e.withdrawn_at is null  -- V1.1 : concert retiré par la source (visible seulement dans les envies)
    and e.starts_at >= greatest(coalesce(p_from, now()), now())
    and (p_to is null or e.starts_at < p_to)
    and (
      p_genre_ids is null
      or cardinality(p_genre_ids) = 0
      or e.genre_id = any (p_genre_ids)
    )
    and (
      -- Rayon autour d'un point de référence.
      (
        r.radius_km is not null
        and r.latitude is not null
        and r.longitude is not null
        and v.latitude is not null
        and v.longitude is not null
        and public.distance_km(r.latitude, r.longitude, v.latitude, v.longitude) <= r.radius_km
      )
      -- Pas de rayon applicable : filtre par ville (ou aucun filtre de lieu).
      or (
        (r.radius_km is null or r.latitude is null or r.longitude is null)
        and (p_city_id is null or v.city_id = p_city_id)
      )
    )
  -- V1.1 : plus de limite fixe (le catalogue réel dépasse 300 concerts) ; l'app pagine avec
  -- « Voir plus » (range) et lit le total (count). L'identifiant départage deux concerts à la même heure.
  order by e.starts_at, e.id;
$$;


create or replace function public.search_events(search_query text)
returns setof public.events
language sql
stable
security invoker
set search_path = ''
as $$
  with query as (
    select public.search_pattern(search_query) as pattern
  )
  select e.*
  from public.events e
  cross join query q
  left join public.venues v on v.id = e.venue_id
  left join public.cities c on c.id = v.city_id
  where length(trim(search_query)) >= 2
    and e.type = 'concert'
    and e.withdrawn_at is null  -- V1.1 : concert retiré par la source
    and e.starts_at >= now()
    and (
      public.normalize_search(e.name) like q.pattern
      or public.normalize_search(v.name) like q.pattern
      or public.normalize_search(c.name) like q.pattern
      or exists (
        select 1
        from public.event_artists ea
        join public.artists a on a.id = ea.artist_id
        where ea.event_id = e.id
          and public.normalize_search(a.name) like q.pattern
      )
    )
  order by e.starts_at
  limit 50;
$$;

-- ---------------------------------------------------------------------------
-- 4. Requêtes de Découvrir et de la Recherche
-- ---------------------------------------------------------------------------
-- Toutes en security invoker : la RLS s'applique (concerts, artistes, salles masqués exclus).

-- « Rap à l'affiche » : prochains concerts d'un genre (60 jours), un seul par tête d'affiche,
-- ceux qui ont une photo d'abord. Hors concerts annulés, reportés ou retirés.
create function public.discover_featured(p_genre_slug text default 'rap', p_limit integer default 8)
returns setof public.events
language sql
stable
security invoker
set search_path = ''
as $$
  with candidates as (
    select distinct on (ea.artist_id)
      e.id,
      e.starts_at,
      (a.image_url is not null or e.image_url is not null) as has_photo
    from public.events e
    join public.genres g on g.id = e.genre_id and g.slug = p_genre_slug
    join public.event_artists ea on ea.event_id = e.id and ea.position = 0
    join public.artists a on a.id = ea.artist_id
    where e.type = 'concert'
      and e.withdrawn_at is null
      and e.status not in ('cancelled', 'postponed')
      and e.starts_at >= now()
      and e.starts_at < now() + interval '60 days'
    order by ea.artist_id, e.starts_at
  )
  select e.*
  from public.events e
  join candidates c on c.id = e.id
  order by c.has_photo desc, c.starts_at
  limit least(greatest(p_limit, 1), 20);
$$;

-- « Cette semaine » : les 7 prochains jours, un genre mis en avant d'abord (le rap), puis par date.
create function public.discover_this_week(p_priority_slug text default 'rap', p_limit integer default 10)
returns setof public.events
language sql
stable
security invoker
set search_path = ''
as $$
  select e.*
  from public.events e
  left join public.genres g on g.id = e.genre_id
  where e.type = 'concert'
    and e.withdrawn_at is null
    and e.starts_at >= now()
    and e.starts_at < now() + interval '7 days'
  order by coalesce(g.slug = p_priority_slug, false) desc, e.starts_at, e.id
  limit least(greatest(p_limit, 1), 50);
$$;

-- Villes classées par nombre de concerts à venir (tuiles « Villes », filtre « Ville »).
-- fallback_image_url : photo d'un artiste qui y joue bientôt, si la ville n'a pas sa propre photo.
-- p_limit null = toutes les villes qui ont au moins un concert.
create function public.city_event_counts(p_limit integer default null)
returns table (
  id uuid,
  name text,
  image_path text,
  fallback_image_url text,
  event_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with counts as (
    select c.id, c.name, c.image_path, count(e.id) as event_count
    from public.cities c
    join public.venues v on v.city_id = c.id
    join public.events e on e.venue_id = v.id
    where e.type = 'concert' and e.withdrawn_at is null and e.starts_at >= now()
    group by c.id
    order by count(e.id) desc, c.name
    limit p_limit
  )
  select
    counts.id,
    counts.name,
    counts.image_path,
    case when counts.image_path is null then (
      select coalesce(a.image_url, e.image_url)
      from public.venues v
      join public.events e on e.venue_id = v.id
      left join public.event_artists ea on ea.event_id = e.id and ea.position = 0
      left join public.artists a on a.id = ea.artist_id
      where v.city_id = counts.id
        and e.type = 'concert' and e.withdrawn_at is null and e.starts_at >= now()
        and coalesce(a.image_url, e.image_url) is not null
      order by e.starts_at
      limit 1
    ) end as fallback_image_url,
    counts.event_count
  from counts
  order by counts.event_count desc, counts.name;
$$;

-- Genres classés par nombre de concerts à venir (« Par genre »).
create function public.genre_event_counts()
returns table (id uuid, slug text, name text, event_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select g.id, g.slug, g.name, count(e.id) as event_count
  from public.genres g
  join public.events e on e.genre_id = g.id
  where e.type = 'concert' and e.withdrawn_at is null and e.starts_at >= now()
  group by g.id
  order by count(e.id) desc, g.name;
$$;

-- « Artistes à l'affiche » (Recherche) : artistes qui ont le plus de concerts à venir,
-- ceux qui ont une photo d'abord à égalité.
create function public.top_artists(p_limit integer default 8)
returns table (id uuid, name text, image_url text, event_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select a.id, a.name, a.image_url, count(distinct e.id) as event_count
  from public.artists a
  join public.event_artists ea on ea.artist_id = a.id
  join public.events e on e.id = ea.event_id
  where e.type = 'concert' and e.withdrawn_at is null and e.starts_at >= now()
  group by a.id
  order by count(distinct e.id) desc, (a.image_url is not null) desc, a.name
  limit least(greatest(p_limit, 1), 50);
$$;

grant execute on function public.discover_featured(text, integer) to anon, authenticated;
grant execute on function public.discover_this_week(text, integer) to anon, authenticated;
grant execute on function public.city_event_counts(integer) to anon, authenticated;
grant execute on function public.genre_event_counts() to anon, authenticated;
grant execute on function public.top_artists(integer) to anon, authenticated;

-- Concerts à venir d'une ville, d'une salle, d'un artiste : index pour les listes du catalogue.
create index if not exists events_upcoming_idx on public.events (starts_at)
  where type = 'concert' and withdrawn_at is null;
