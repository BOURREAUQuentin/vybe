-- V1.1 : fusionne 6 villes en double apparues lors de l'import de la nuit du 16/11.
--
-- Le 15/11, la mise en forme des noms à l'import a été corrigée (« D Auvergne » → « d'Auvergne »,
-- transform.ts : normalizeCityName). L'import suivant a donc écrit ces villes avec l'apostrophe et,
-- ne les trouvant pas sous ce nom, les a créées une seconde fois ; leurs salles y sont passées.
-- Les anciennes villes (écriture « -d- ») sont restées vides, mais portaient la photo trouvée le 15/11.
--
-- Ici, pour chaque paire : la photo et son crédit passent sur la bonne ville (si elle n'en a pas),
-- les salles et villes favorites éventuelles aussi, puis l'ancienne ville (vide) est supprimée.
-- Une paire déjà absente est ignorée. La mise en forme corrigée ne recrée pas ces doublons.

do $$
declare
  pair record;
  v_bad uuid;
  v_good uuid;
begin
  for pair in
    select * from (values
      ('Cournon-d-Auvergne', 'Cournon-d''Auvergne'),
      ('Mezidon-Vallee-d-Auge', 'Mezidon-Vallee-d''Auge'),
      ('Pontonx-sur-l-Adour', 'Pontonx-sur-l''Adour'),
      ('Saint-Jean-d-Illac', 'Saint-Jean-d''Illac'),
      ('Saint-Maurice-l-Exil', 'Saint-Maurice-l''Exil'),
      ('Villenave-d-Ornon', 'Villenave-d''Ornon')
    ) as p (bad_name, good_name)
  loop
    select id into v_bad from public.cities where name = pair.bad_name and country_code = 'FR';
    select id into v_good from public.cities where name = pair.good_name and country_code = 'FR';
    continue when v_bad is null or v_good is null;

    -- Photo (et crédit, page d'origine) : gardée sur la bonne ville si elle n'en a pas encore.
    update public.cities good
    set image_path = bad.image_path,
        image_credit = bad.image_credit,
        image_source_url = bad.image_source_url
    from public.cities bad
    where good.id = v_good and bad.id = v_bad
      and good.image_path is null and bad.image_path is not null;

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
