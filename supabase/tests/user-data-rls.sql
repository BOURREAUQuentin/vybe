-- Test de sécurité des tables utilisateur (V1.3). TOUT est annulé à la fin :
-- le dernier bloc lève volontairement une erreur qui affiche le bilan et annule la transaction.
begin;

create temp table t_results (n serial, test text, ok boolean);
grant all on t_results to authenticated, anon;
grant all on sequence t_results_n_seq to authenticated, anon;

-- Deux utilisateurs fictifs (supprimés par l'annulation finale).
insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'test-a@example.invalid', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'test-b@example.invalid', 'authenticated', 'authenticated');

create temp table t_ids as
select
  (select id from public.artists order by name limit 1) as artist_id,
  (select id from public.events order by starts_at desc limit 1) as event_id,
  (select id from public.venues order by name limit 1) as venue_id,
  (select id from public.cities order by name limit 1) as city1,
  (select id from public.cities order by name offset 1 limit 1) as city2,
  (select id from public.genres order by name limit 1) as genre_id;
grant select on t_ids to authenticated, anon;

-- ===================== En tant que A =====================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-00000000000a","role":"authenticated"}', true);

insert into public.user_artist_follows (artist_id) select artist_id from t_ids;
insert into public.user_events (event_id) select event_id from t_ids;
insert into public.user_venue_follows (venue_id) select venue_id from t_ids;
insert into public.user_favorite_cities (city_id, is_main) select city1, true from t_ids;
insert into public.user_genre_preferences (genre_id) select genre_id from t_ids;

insert into t_results (test, ok) select
  '1. A retrouve son artiste suivi, son envie (wishlist), sa salle, sa ville principale, son genre',
  (select count(*) from public.user_artist_follows) = 1
  and (select count(*) from public.user_events where status = 'wishlist') = 1
  and (select count(*) from public.user_venue_follows) = 1
  and (select count(*) from public.user_favorite_cities where is_main) = 1
  and (select count(*) from public.user_genre_preferences) = 1;

insert into t_results (test, ok) select
  '1b. user_id rempli automatiquement avec l''identifiant de A',
  (select bool_and(user_id = 'aaaaaaaa-0000-4000-8000-00000000000a') from public.user_artist_follows);

do $$ begin
  insert into public.user_favorite_cities (city_id, is_main) select city2, true from t_ids;
  insert into t_results (test, ok) values ('4. Une 2e ville principale pour A est refusée', false);
exception when unique_violation then
  insert into t_results (test, ok) values ('4. Une 2e ville principale pour A est refusée', true);
end $$;

do $$ begin
  insert into public.user_artist_follows (artist_id) select artist_id from t_ids;
  insert into t_results (test, ok) values ('4b. Suivre deux fois le même artiste est refusé', false);
exception when unique_violation then
  insert into t_results (test, ok) values ('4b. Suivre deux fois le même artiste est refusé', true);
end $$;

-- Ville principale (V1.3, set_main_city) : changement en une seule opération.
select public.set_main_city((select city2 from t_ids), 25::smallint);
insert into t_results (test, ok) select
  '7a. set_main_city : une seule ville principale (la nouvelle, rayon 25), l''ancienne reste favorite',
  (select count(*) from public.user_favorite_cities where is_main) = 1
  and (select city_id = (select city2 from t_ids) and radius_km = 25
       from public.user_favorite_cities where is_main)
  and exists (select 1 from public.user_favorite_cities
              where city_id = (select city1 from t_ids) and not is_main);

do $$ begin
  perform public.set_main_city((select city1 from t_ids), 999::smallint);
  insert into t_results (test, ok) values ('7b. set_main_city : rayon invalide refusé', false);
exception when invalid_parameter_value then
  insert into t_results (test, ok) values ('7b. set_main_city : rayon invalide refusé', true);
end $$;

-- ===================== En tant que B =====================
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-00000000000b","role":"authenticated"}', true);

insert into t_results (test, ok) select
  '2a. B ne voit aucune ligne de A (5 tables)',
  (select count(*) from public.user_artist_follows) = 0
  and (select count(*) from public.user_events) = 0
  and (select count(*) from public.user_venue_follows) = 0
  and (select count(*) from public.user_favorite_cities) = 0
  and (select count(*) from public.user_genre_preferences) = 0;

do $$ begin
  insert into public.user_artist_follows (user_id, artist_id)
    select 'aaaaaaaa-0000-4000-8000-00000000000a', artist_id from t_ids;
  insert into t_results (test, ok) values ('2b. B ne peut pas créer une ligne au nom de A', false);
exception when insufficient_privilege then
  insert into t_results (test, ok) values ('2b. B ne peut pas créer une ligne au nom de A', true);
end $$;

with changed as (update public.user_events set status = 'going' returning 1)
insert into t_results (test, ok) select '2c. B ne peut pas modifier les lignes de A', count(*) = 0 from changed;

with removed as (delete from public.user_artist_follows returning 1)
insert into t_results (test, ok) select '2d. B ne peut pas supprimer les lignes de A', count(*) = 0 from removed;

insert into public.user_genre_preferences (genre_id) select genre_id from t_ids;
insert into t_results (test, ok) select
  '2e. B peut gérer ses propres lignes', (select count(*) from public.user_genre_preferences) = 1;

-- B pose sa propre ville principale : celle de A ne bouge pas.
select public.set_main_city((select city1 from t_ids), 10::smallint);
reset role;
insert into t_results (test, ok) select
  '7c. set_main_city de B ne touche pas à la ville principale de A',
  (select city_id = (select city2 from t_ids) and radius_km = 25 from public.user_favorite_cities
   where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a' and is_main)
  and (select count(*) from public.user_favorite_cities
       where user_id = 'bbbbbbbb-0000-4000-8000-00000000000b' and is_main) = 1;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-00000000000b","role":"authenticated"}', true);

-- ===================== Visiteur non connecté =====================
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$ begin
  perform 1 from public.user_events;
  insert into t_results (test, ok) values ('3a. Visiteur non connecté : lecture refusée', false);
exception when insufficient_privilege then
  insert into t_results (test, ok) values ('3a. Visiteur non connecté : lecture refusée', true);
end $$;

do $$ begin
  insert into public.user_artist_follows (user_id, artist_id)
    select 'aaaaaaaa-0000-4000-8000-00000000000a', artist_id from t_ids;
  insert into t_results (test, ok) values ('3b. Visiteur non connecté : écriture refusée', false);
exception when insufficient_privilege then
  insert into t_results (test, ok) values ('3b. Visiteur non connecté : écriture refusée', true);
end $$;

do $$ begin
  perform public.set_main_city((select city1 from t_ids), 50::smallint);
  insert into t_results (test, ok) values ('7d. Visiteur non connecté : set_main_city() refusé', false);
exception when insufficient_privilege then
  insert into t_results (test, ok) values ('7d. Visiteur non connecté : set_main_city() refusé', true);
end $$;

do $$ begin
  perform public.delete_my_account();
  insert into t_results (test, ok) values ('6. Visiteur non connecté : delete_my_account() refusé', false);
exception when insufficient_privilege then
  insert into t_results (test, ok) values ('6. Visiteur non connecté : delete_my_account() refusé', true);
end $$;

insert into t_results (test, ok) select
  '3c. Catalogue toujours lisible par un visiteur', (select count(*) from public.events) > 0;

-- ===================== A supprime son compte =====================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-00000000000a","role":"authenticated"}', true);
select public.delete_my_account();

reset role;
insert into t_results (test, ok) select
  '5a. Compte A supprimé', not exists (select 1 from auth.users where id = 'aaaaaaaa-0000-4000-8000-00000000000a');
insert into t_results (test, ok) select
  '5b. Toutes les lignes de A supprimées (cascade, 5 tables)',
  (select count(*) from public.user_artist_follows where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a')
  + (select count(*) from public.user_events where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a')
  + (select count(*) from public.user_venue_follows where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a')
  + (select count(*) from public.user_favorite_cities where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a')
  + (select count(*) from public.user_genre_preferences where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a') = 0;
insert into t_results (test, ok) select
  '5c. B et ses données intacts',
  exists (select 1 from auth.users where id = 'bbbbbbbb-0000-4000-8000-00000000000b')
  and (select count(*) from public.user_genre_preferences where user_id = 'bbbbbbbb-0000-4000-8000-00000000000b') = 1;

-- Bilan + annulation de TOUT (erreur volontaire). Bilan compact (la CLI tronque les longs
-- messages) : nombre de réussites, puis uniquement les cas en échec.
do $$ begin
  raise exception E'BILAN (transaction annulée, rien n''est enregistré) : %/% réussis%',
    (select count(*) filter (where ok) from t_results),
    (select count(*) from t_results),
    coalesce(
      E'\n' || (select string_agg('✗ ÉCHEC ' || test, E'\n' order by n) from t_results where not ok),
      ' ✓ — aucun échec'
    );
end $$;
