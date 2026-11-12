-- Vybe — V1.2 : recherche des salles (groupe « Salles » de l'écran Recherche).
-- Même principe que search_artists / search_cities (migration « search ») :
-- insensible à la casse et aux accents, saisie neutralisée, security invoker (la RLS s'applique).
-- L'index trigramme venues_name_search_idx existe déjà.

create function public.search_venues(search_query text)
returns setof public.venues
language sql
stable
security invoker
set search_path = ''
as $$
  select v.*
  from public.venues v
  where length(trim(search_query)) >= 2
    and public.normalize_search(v.name) like public.search_pattern(search_query)
  order by
    position(public.normalize_search(trim(search_query)) in public.normalize_search(v.name)),
    v.name
  limit 10;
$$;

grant execute on function public.search_venues(text) to anon, authenticated;
