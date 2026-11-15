-- V1.1 : recherche multi-mots (« orelsan nantes », « zenith rap ») et concerts paginés.
--
-- Avant : toute la saisie devait se trouver telle quelle dans UN champ (« orelsan nantes » ne
-- donnait rien). Maintenant la saisie est découpée en mots, et CHAQUE mot doit se trouver quelque
-- part : pour un concert, dans son nom, ses artistes, sa salle, sa ville ou son genre ; pour une
-- salle, dans son nom ou sa ville ; pour un artiste, dans son nom. Toujours insensible aux
-- accents et à la casse. Les mots d'une lettre et les mots vides (« le », « de »…) sont ignorés.
-- search_events n'a plus de limite : l'app pagine (10 concerts, puis « Voir plus »).

-- Mots utiles d'une saisie, normalisés (minuscules, sans accents).
create function public.search_words(search_query text)
returns text[]
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(array_agg(distinct word), '{}')
  from regexp_split_to_table(public.normalize_search(search_query), '[^a-z0-9]+') as word
  where length(word) >= 2
    and word not in ('le', 'la', 'les', 'de', 'du', 'des', 'et', 'au', 'aux', 'en', 'un', 'une', 'sur', 'pour', 'avec');
$$;

-- Motif « contient » d'un mot déjà normalisé (caractères spéciaux de LIKE neutralisés).
create function public.word_pattern(word text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select '%' || replace(replace(replace(word, '\', '\\'), '%', '\%'), '_', '\_') || '%';
$$;

-- ---------------------------------------------------------------------------
-- Concerts : chaque mot dans le nom, un artiste, la salle, la ville ou le genre.
-- ---------------------------------------------------------------------------

create or replace function public.search_events(search_query text)
returns setof public.events
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select public.search_words(search_query) as words)
  select e.*
  from public.events e
  cross join q
  left join public.venues v on v.id = e.venue_id
  left join public.cities c on c.id = v.city_id
  left join public.genres g on g.id = e.genre_id
  where cardinality(q.words) > 0
    and e.type = 'concert'
    and e.withdrawn_at is null  -- concert retiré par la source
    and e.starts_at >= now()
    and not exists (
      select 1
      from unnest(q.words) as w
      where not (
        public.normalize_search(e.name) like public.word_pattern(w)
        or public.normalize_search(v.name) like public.word_pattern(w)
        or public.normalize_search(c.name) like public.word_pattern(w)
        or public.normalize_search(g.name) like public.word_pattern(w)
        or exists (
          select 1
          from public.event_artists ea
          join public.artists a on a.id = ea.artist_id
          where ea.event_id = e.id
            and public.normalize_search(a.name) like public.word_pattern(w)
        )
      )
    )
  order by e.starts_at, e.id;
$$;

-- ---------------------------------------------------------------------------
-- Artistes : chaque mot dans le nom ; les noms qui commencent par la saisie d'abord.
-- ---------------------------------------------------------------------------

create or replace function public.search_artists(search_query text)
returns setof public.artists
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select public.search_words(search_query) as words)
  select a.*
  from public.artists a
  cross join q
  where cardinality(q.words) > 0
    and not exists (
      select 1 from unnest(q.words) as w
      where public.normalize_search(a.name) not like public.word_pattern(w)
    )
  order by
    (public.normalize_search(a.name) like public.normalize_search(trim(search_query)) || '%') desc,
    length(a.name),
    a.name
  limit 10;
$$;

-- ---------------------------------------------------------------------------
-- Salles : chaque mot dans le nom de la salle ou de sa ville (« zenith nantes »).
-- ---------------------------------------------------------------------------

create or replace function public.search_venues(search_query text)
returns setof public.venues
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select public.search_words(search_query) as words)
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
    -- Salles dont le NOM contient toute la saisie d'abord, puis par nom.
    (public.normalize_search(v.name) like public.search_pattern(search_query)) desc,
    v.name
  limit 10;
$$;

grant execute on function public.search_words(text) to anon, authenticated;
grant execute on function public.word_pattern(text) to anon, authenticated;
