-- Vybe — V1.3 : changer de ville principale en une seule opération.
-- Retire l'ancienne ville principale (elle reste favorite) puis pose la nouvelle, avec son rayon.
-- security invoker : la RLS s'applique, l'utilisateur ne touche que ses propres lignes.
-- L'index unique user_favorite_cities_one_main_idx garantit qu'il n'y en a jamais deux.

create function public.set_main_city(p_city_id uuid, p_radius_km smallint default 50)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Aucun utilisateur connecté.' using errcode = '42501';
  end if;
  if p_radius_km is null or p_radius_km not between 1 and 500 then
    raise exception 'Rayon invalide (1 à 500 km).' using errcode = '22023';
  end if;

  update public.user_favorite_cities
  set is_main = false
  where user_id = current_user_id and is_main and city_id <> p_city_id;

  insert into public.user_favorite_cities (city_id, is_main, radius_km)
  values (p_city_id, true, p_radius_km)
  on conflict (user_id, city_id) do update
    set is_main = true, radius_km = excluded.radius_km;
end;
$$;

revoke execute on function public.set_main_city(uuid, smallint) from public, anon;
grant execute on function public.set_main_city(uuid, smallint) to authenticated;

comment on function public.set_main_city(uuid, smallint) is 'Définit la ville principale (et son rayon) de l''utilisateur connecté ; l''ancienne reste favorite.';
