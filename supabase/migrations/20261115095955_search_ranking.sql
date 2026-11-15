-- V1.1 : classement des résultats de recherche (artistes, salles, villes) et pagination côté app.
--
-- Avant : 10 résultats au plus, par ordre alphabétique → avec plus de 10 « Zénith », celui de
-- Nantes n'apparaissait jamais. Maintenant, plus de limite (l'app affiche 5 résultats puis
-- « Voir plus ») et un classement :
--   1. tes choix d'abord (compte connecté) : artistes suivis ; salles favorites et salles de tes
--      villes ; tes villes ;
--   2. l'activité : le plus de concerts à venir d'abord ;
--   3. le nom.
-- Les choix de l'utilisateur sont lus par de petites fonctions security definer qui ne renvoient
-- QUE les lignes de l'appelant (auth.uid()), et rien pour un visiteur sans compte (qui n'a aucun
-- droit sur les tables utilisateur).

-- ---------------------------------------------------------------------------
-- Choix de l'utilisateur connecté (vides sans compte)
-- ---------------------------------------------------------------------------

create function public.my_followed_artist_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(artist_id), '{}') from public.user_artist_follows where user_id = auth.uid();
$$;

create function public.my_favorite_venue_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(venue_id), '{}') from public.user_venue_follows where user_id = auth.uid();
$$;

create function public.my_favorite_city_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(city_id), '{}') from public.user_favorite_cities where user_id = auth.uid();
$$;

revoke execute on function public.my_followed_artist_ids() from public;
revoke execute on function public.my_favorite_venue_ids() from public;
revoke execute on function public.my_favorite_city_ids() from public;
grant execute on function public.my_followed_artist_ids() to anon, authenticated;
grant execute on function public.my_favorite_venue_ids() to anon, authenticated;
grant execute on function public.my_favorite_city_ids() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Artistes
-- ---------------------------------------------------------------------------

create or replace function public.search_artists(search_query text)
returns setof public.artists
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select public.search_words(search_query) as words, public.my_followed_artist_ids() as mine)
  select a.*
  from public.artists a
  cross join q
  where cardinality(q.words) > 0
    and not exists (
      select 1 from unnest(q.words) as w
      where public.normalize_search(a.name) not like public.word_pattern(w)
    )
  order by
    (a.id = any (q.mine)) desc,
    (
      select count(*)
      from public.event_artists ea
      join public.events e on e.id = ea.event_id
      where ea.artist_id = a.id and e.type = 'concert' and e.withdrawn_at is null and e.starts_at >= now()
    ) desc,
    a.name,
    a.id;
$$;

-- ---------------------------------------------------------------------------
-- Salles (« zenith nantes » : chaque mot dans le nom de la salle ou de sa ville)
-- ---------------------------------------------------------------------------

create or replace function public.search_venues(search_query text)
returns setof public.venues
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select
      public.search_words(search_query) as words,
      public.my_favorite_venue_ids() as my_venues,
      public.my_favorite_city_ids() as my_cities
  )
  select v.*
  from public.venues v
  cross join q
  left join public.cities c on c.id = v.city_id
  where cardinality(q.words) > 0
    and not exists (
      select 1 from unnest(q.words) as w
      where not (
        public.normalize_search(v.name) like public.word_pattern(w)
        or public.normalize_search(c.name) like public.word_pattern(w)
      )
    )
  order by
    (v.id = any (q.my_venues)) desc,
    (v.city_id = any (q.my_cities)) desc,
    (
      select count(*) from public.events e
      where e.venue_id = v.id and e.type = 'concert' and e.withdrawn_at is null and e.starts_at >= now()
    ) desc,
    v.name,
    v.id;
$$;

-- ---------------------------------------------------------------------------
-- Villes (« saint » : des dizaines de résultats)
-- ---------------------------------------------------------------------------

create or replace function public.search_cities(search_query text)
returns setof public.cities
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select public.search_words(search_query) as words, public.my_favorite_city_ids() as mine)
  select c.*
  from public.cities c
  cross join q
  where cardinality(q.words) > 0
    and not exists (
      select 1 from unnest(q.words) as w
      where public.normalize_search(c.name) not like public.word_pattern(w)
    )
  order by
    (c.id = any (q.mine)) desc,
    (
      select count(*)
      from public.venues v
      join public.events e on e.venue_id = v.id
      where v.city_id = c.id and e.type = 'concert' and e.withdrawn_at is null and e.starts_at >= now()
    ) desc,
    c.name,
    c.id;
$$;
