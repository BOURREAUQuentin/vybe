-- V1.1 : fusionne deux villes en double créées par l'import Ticketmaster.
--   « Nantes,-France »       → « Nantes »                (source : « Nantes, France »)
--   « Les Sables-d-Olonne »  → « Les Sables-d'Olonne »   (source : « Les Sables D Olonne »)
-- La mise en forme des noms à l'import est corrigée (transform.ts : normalizeCityName), ces
-- doublons ne reviennent donc pas. Ici : les salles et les villes favorites passent sur la bonne
-- ville, puis la ville en double (alors vide) est supprimée. Une paire déjà absente est ignorée.

do $$
declare
  pair record;
  v_bad uuid;
  v_good uuid;
begin
  for pair in
    select * from (values
      ('Nantes,-France', 'Nantes'),
      ('Les Sables-d-Olonne', 'Les Sables-d''Olonne')
    ) as p (bad_name, good_name)
  loop
    select id into v_bad from public.cities where name = pair.bad_name and country_code = 'FR';
    select id into v_good from public.cities where name = pair.good_name and country_code = 'FR';
    continue when v_bad is null or v_good is null;

    update public.venues set city_id = v_good where city_id = v_bad;

    -- Ville favorite : reportée sur la bonne ville (sans doublon) ; reste principale seulement si
    -- l'utilisateur n'en a pas déjà une autre.
    insert into public.user_favorite_cities (user_id, city_id, is_main, radius_km)
    select f.user_id, v_good,
           f.is_main and not exists (
             select 1 from public.user_favorite_cities o
             where o.user_id = f.user_id and o.is_main and o.city_id <> v_bad
           ),
           f.radius_km
    from public.user_favorite_cities f
    where f.city_id = v_bad
    on conflict (user_id, city_id) do nothing;

    delete from public.cities where id = v_bad;
  end loop;
end;
$$;
