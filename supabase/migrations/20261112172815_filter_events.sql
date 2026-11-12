-- Vybe — V1.2 : filtres combinables (date, ville, genre, rayon).
-- Fonction appelée par l'écran « Tous les concerts » via supabase.rpc('filter_events').
-- security invoker : la RLS s'applique (lecture seule, concerts masqués exclus).
-- La position éventuelle de l'utilisateur (étape « près de moi ») n'est ni enregistrée
-- ni journalisée par cette fonction : elle sert uniquement au calcul de distance.

-- Distance en kilomètres entre deux points (formule de haversine, rayon terrestre 6 371 km).
create function public.distance_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns double precision
language sql
immutable
parallel safe
set search_path = ''
as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

-- Règles :
-- - jamais de concert passé : début >= max(p_from, maintenant) ; p_to exclu, null = sans fin ;
-- - genres : null ou tableau vide = tous ;
-- - ville sans rayon : salles de cette ville ;
-- - rayon (1 à 500 km) autour d'un point : la position (p_latitude/p_longitude) si fournie,
--   sinon le centre de la ville p_city_id ; sans point de référence, le rayon est ignoré.
create function public.filter_events(
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
  order by e.starts_at
  limit 300;
$$;

grant execute on function public.filter_events(
  timestamptz, timestamptz, uuid, uuid[], double precision, double precision, double precision
) to anon, authenticated;
