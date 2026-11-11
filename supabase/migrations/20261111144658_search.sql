-- Vybe — Recherche par artiste, concert ou ville (MVP, étape 7).
-- Insensible à la casse et aux accents : « zenith » trouve « Zénith ».
-- Les fonctions s'exécutent avec les droits de l'appelant (security invoker) :
-- la RLS s'applique (lecture seule, concerts masqués exclus).

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Outils
-- ---------------------------------------------------------------------------

-- Texte normalisé pour la recherche : minuscules, sans accents.
create function public.normalize_search(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, '')));
$$;

-- Motif « contient » pour LIKE, avec %, _ et \ neutralisés dans la saisie.
create function public.search_pattern(search_query text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select '%'
    || replace(replace(replace(public.normalize_search(trim(search_query)), '\', '\\'), '%', '\%'), '_', '\_')
    || '%';
$$;

-- ---------------------------------------------------------------------------
-- Fonctions de recherche (appelées par l'application via supabase.rpc)
-- Moins de 2 caractères : aucun résultat.
-- ---------------------------------------------------------------------------

-- Artistes dont le nom contient la saisie ; ceux qui commencent par la saisie d'abord.
create function public.search_artists(search_query text)
returns setof public.artists
language sql
stable
security invoker
set search_path = ''
as $$
  select a.*
  from public.artists a
  where length(trim(search_query)) >= 2
    and public.normalize_search(a.name) like public.search_pattern(search_query)
  order by
    position(public.normalize_search(trim(search_query)) in public.normalize_search(a.name)),
    a.name
  limit 10;
$$;

-- Villes dont le nom contient la saisie.
create function public.search_cities(search_query text)
returns setof public.cities
language sql
stable
security invoker
set search_path = ''
as $$
  select c.*
  from public.cities c
  where length(trim(search_query)) >= 2
    and public.normalize_search(c.name) like public.search_pattern(search_query)
  order by
    position(public.normalize_search(trim(search_query)) in public.normalize_search(c.name)),
    c.name
  limit 10;
$$;

-- Concerts à venir dont le nom, un artiste, la salle ou la ville contient la saisie.
create function public.search_events(search_query text)
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

grant execute on function public.search_artists(text) to anon, authenticated;
grant execute on function public.search_cities(text) to anon, authenticated;
grant execute on function public.search_events(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Index trigrammes : gardent la recherche « contient » rapide quand le catalogue grossit (V1.1).
-- ---------------------------------------------------------------------------

create index artists_name_search_idx on public.artists
  using gin (public.normalize_search(name) extensions.gin_trgm_ops);
create index cities_name_search_idx on public.cities
  using gin (public.normalize_search(name) extensions.gin_trgm_ops);
create index venues_name_search_idx on public.venues
  using gin (public.normalize_search(name) extensions.gin_trgm_ops);
create index events_name_search_idx on public.events
  using gin (public.normalize_search(name) extensions.gin_trgm_ops);
