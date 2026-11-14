-- Test de l'import Ticketmaster (V1.1, fonction import_ticketmaster_events). TOUT est annulé à la fin :
-- le dernier bloc lève volontairement une erreur qui affiche le bilan et annule la transaction.
-- Lancement : npx supabase db query --remote --file supabase/tests/ticketmaster-import.sql --yes
begin;

create temp table t_results (n serial, test text, ok boolean);
grant all on t_results to authenticated, anon, service_role;
grant all on sequence t_results_n_seq to authenticated, anon, service_role;

-- Lot n° 1 : deux concerts, une ville inconnue (« Testville »), trois artistes, un genre connu.
create temp table t_batch1 as select $json$[
  {
    "external_id": "TEST-EV-1", "name": "Concert test 1", "type": "concert", "status": "on_sale",
    "starts_at": "2030-03-01T19:00:00Z", "time_tba": false, "ticket_url": "https://example.invalid/1",
    "price_min": 35, "price_max": 50, "currency": "EUR", "image_url": "https://example.invalid/ev1.jpg",
    "genre": "Hip-Hop/Rap", "sub_genre": "French Rap",
    "venue": { "external_id": "TEST-VE-1", "name": "Salle test", "address": "1 rue du Test",
               "postal_code": "99000", "latitude": 47.5, "longitude": -1.2,
               "city": { "name": "Testville", "country_code": "FR" } },
    "attractions": [
      { "external_id": "TEST-AR-1", "name": "Artiste test 1", "image_url": "https://example.invalid/a1.jpg",
        "genre": "Hip-Hop/Rap" },
      { "external_id": "TEST-AR-2", "name": "Artiste test 2", "genre": "R&B" }
    ]
  },
  {
    "external_id": "TEST-EV-2", "name": "Concert test 2", "type": "festival", "status": "announced",
    "starts_at": "2030-04-01T18:00:00Z", "time_tba": true, "genre": "Genre inconnu",
    "venue": { "external_id": "TEST-VE-1", "name": "Salle test",
               "city": { "name": "Testville", "country_code": "FR" } },
    "attractions": [ { "external_id": "TEST-AR-3", "name": "Artiste test 3" } ]
  }
]$json$::jsonb as batch;

-- Lot n° 2 : le concert 1 est annulé, change de date et de prix, l'artiste 2 quitte l'affiche ;
-- la salle n'envoie plus son adresse (elle doit être conservée).
create temp table t_batch2 as select $json$[
  {
    "external_id": "TEST-EV-1", "name": "Concert test 1", "type": "concert", "status": "cancelled",
    "starts_at": "2030-03-08T20:00:00Z", "time_tba": false, "ticket_url": "https://example.invalid/1",
    "price_min": 40, "price_max": 60, "currency": "EUR",
    "genre": "Hip-Hop/Rap",
    "venue": { "external_id": "TEST-VE-1", "name": "Salle test",
               "city": { "name": "Testville", "country_code": "FR" } },
    "attractions": [ { "external_id": "TEST-AR-1", "name": "Artiste test 1" } ]
  }
]$json$::jsonb as batch;

grant select on t_batch1, t_batch2 to service_role, authenticated, anon;

-- Utilisateur fictif (supprimé par l'annulation finale).
insert into auth.users (id, email, aud, role) values
  ('cccccccc-0000-4000-8000-00000000000c', 'test-c@example.invalid', 'authenticated', 'authenticated');

create temp table t_out (step text, result jsonb);
grant all on t_out to service_role;

-- ===================== Import n° 1 (serveur) =====================
set local role service_role;
insert into t_out select 'import1', public.import_ticketmaster_events((select batch from t_batch1), now());
reset role;

insert into t_results (test, ok) select
  '1. Import n° 1 : 2 créés, 0 modifié',
  (select result from t_out where step = 'import1') = '{"created": 2, "updated": 0}'::jsonb;

insert into t_results (test, ok) select
  '2. Ville inconnue créée avec les coordonnées de la salle',
  exists (select 1 from public.cities where name = 'Testville' and latitude = 47.5 and longitude = -1.2);

insert into t_results (test, ok) select
  '3. Salle créée (source ticketmaster) avec son adresse',
  exists (select 1 from public.venues where source = 'ticketmaster' and external_id = 'TEST-VE-1'
          and address = '1 rue du Test' and postal_code = '99000');

insert into t_results (test, ok) select
  '4. Concert 1 : statut, prix, image, genre Rap, salle',
  exists (
    select 1 from public.events e
    join public.genres g on g.id = e.genre_id
    join public.venues v on v.id = e.venue_id
    where e.external_id = 'TEST-EV-1' and e.status = 'on_sale' and e.price_min = 35
      and e.image_url = 'https://example.invalid/ev1.jpg' and g.slug = 'rap' and v.external_id = 'TEST-VE-1'
      and e.last_seen_at is not null
  );

insert into t_results (test, ok) select
  '5. Line-up du concert 1 : artiste 1 tête d''affiche, artiste 2 première partie',
  (select string_agg(a.external_id || ':' || ea.role || ':' || ea.position, ',' order by ea.position)
   from public.event_artists ea
   join public.events e on e.id = ea.event_id
   join public.artists a on a.id = ea.artist_id
   where e.external_id = 'TEST-EV-1') = 'TEST-AR-1:headliner:0,TEST-AR-2:support:1';

insert into t_results (test, ok) select
  '6. Genre inconnu → aucun genre (jamais de genre inventé) ; festival enregistré comme festival',
  exists (select 1 from public.events where external_id = 'TEST-EV-2' and genre_id is null
          and type = 'festival' and time_tba);

insert into t_results (test, ok) select
  '7. Genres des artistes : Rap, R&B, aucun',
  (select string_agg(a.external_id || ':' || coalesce(g.slug, '-'), ',' order by a.external_id)
   from public.artists a left join public.genres g on g.id = a.genre_id
   where a.external_id like 'TEST-AR-%') = 'TEST-AR-1:rap,TEST-AR-2:rnb,TEST-AR-3:-';

-- L'utilisateur garde le concert 1 dans ses envies et suit l'artiste 1 ; le concert 2 est masqué à la main.
insert into public.user_events (user_id, event_id)
  select 'cccccccc-0000-4000-8000-00000000000c', id from public.events where external_id = 'TEST-EV-1';
insert into public.user_artist_follows (user_id, artist_id)
  select 'cccccccc-0000-4000-8000-00000000000c', id from public.artists where external_id = 'TEST-AR-1';
update public.events set is_hidden = true where external_id = 'TEST-EV-2';

-- ===================== Imports n° 2 et n° 3 (serveur) =====================
set local role service_role;
insert into t_out select 'import2', public.import_ticketmaster_events((select batch from t_batch2), now());
insert into t_out select 'import3', public.import_ticketmaster_events(jsonb_build_array((select batch from t_batch1) -> 1), now());
reset role;

insert into t_results (test, ok) select
  '8. Import n° 2 : 0 créé, 1 modifié ; aucun doublon',
  (select result from t_out where step = 'import2') = '{"created": 0, "updated": 1}'::jsonb
  and (select count(*) from public.events where external_id like 'TEST-EV-%') = 2
  and (select count(*) from public.venues where external_id = 'TEST-VE-1') = 1
  and (select count(*) from public.cities where name = 'Testville') = 1;

insert into t_results (test, ok) select
  '9. Concert 1 répercuté : annulé, nouvelle date, nouveaux prix ; image conservée',
  exists (select 1 from public.events where external_id = 'TEST-EV-1' and status = 'cancelled'
          and starts_at = '2030-03-08T20:00:00Z' and price_min = 40 and price_max = 60
          and image_url = 'https://example.invalid/ev1.jpg');

insert into t_results (test, ok) select
  '10. Artiste retiré de l''affiche retiré du line-up (l''artiste reste au catalogue)',
  (select count(*) from public.event_artists ea join public.events e on e.id = ea.event_id
   where e.external_id = 'TEST-EV-1') = 1
  and exists (select 1 from public.artists where external_id = 'TEST-AR-2');

insert into t_results (test, ok) select
  '11. Adresse de la salle conservée quand la source ne l''envoie plus',
  exists (select 1 from public.venues where external_id = 'TEST-VE-1' and address = '1 rue du Test');

insert into t_results (test, ok) select
  '12. Envie et artiste suivi de l''utilisateur intacts après les imports',
  exists (select 1 from public.user_events ue join public.events e on e.id = ue.event_id
          where ue.user_id = 'cccccccc-0000-4000-8000-00000000000c' and e.external_id = 'TEST-EV-1')
  and exists (select 1 from public.user_artist_follows f join public.artists a on a.id = f.artist_id
              where f.user_id = 'cccccccc-0000-4000-8000-00000000000c' and a.external_id = 'TEST-AR-1');

insert into t_results (test, ok) select
  '13. Concert masqué à la main reste masqué après un nouvel import',
  (select result from t_out where step = 'import3') = '{"created": 0, "updated": 1}'::jsonb
  and exists (select 1 from public.events where external_id = 'TEST-EV-2' and is_hidden);

-- ===================== Cycle de vie (étape 4) =====================
-- Lot n° 3 : EV-3 (à venir, gardé en envie par l'utilisateur), EV-6 (à venir, gardé par personne),
-- EV-4 (passé, seul concert de l'artiste AR-4 et de la salle VE-2), EV-5 (passé, gardé en envie).
create temp table t_batch3 as select $json$[
  { "external_id": "TEST-EV-3", "name": "Concert test 3", "status": "on_sale", "starts_at": "2030-05-01T19:00:00Z",
    "venue": { "external_id": "TEST-VE-1", "name": "Salle test", "city": { "name": "Testville", "country_code": "FR" } },
    "attractions": [ { "external_id": "TEST-AR-1", "name": "Artiste test 1" } ] },
  { "external_id": "TEST-EV-6", "name": "Concert test 6", "status": "on_sale", "starts_at": "2030-06-01T19:00:00Z",
    "attractions": [] },
  { "external_id": "TEST-EV-4", "name": "Concert test 4", "status": "on_sale", "starts_at": "2020-01-10T19:00:00Z",
    "venue": { "external_id": "TEST-VE-2", "name": "Salle test 2", "city": { "name": "Testville", "country_code": "FR" } },
    "attractions": [ { "external_id": "TEST-AR-4", "name": "Artiste test 4" } ] },
  { "external_id": "TEST-EV-5", "name": "Concert test 5", "status": "on_sale", "starts_at": "2020-02-10T19:00:00Z",
    "attractions": [] }
]$json$::jsonb as batch;
grant select on t_batch3 to service_role;

set local role service_role;
insert into t_out select 'import4', public.import_ticketmaster_events((select batch from t_batch3), now());
reset role;

insert into public.user_events (user_id, event_id)
  select 'cccccccc-0000-4000-8000-00000000000c', id from public.events where external_id in ('TEST-EV-3', 'TEST-EV-5');

-- Fin d'un import INCOMPLET (un jour plus tard, rien revu) : passés oui, retraits non, purge oui.
set local role service_role;
insert into t_out select 'finish0', public.finish_ticketmaster_sync(now() + interval '1 day', '2031-01-01', false, now());
reset role;

insert into t_results (test, ok) select
  '14. Import incomplet : aucun compteur d''absence n''avance (le catalogue n''est jamais vidé)',
  (select coalesce(max(missed_syncs), 0) from public.events where external_id like 'TEST-EV-%') = 0
  and (select (result ->> 'withdrawn')::int from t_out where step = 'finish0') = 0;

insert into t_results (test, ok) select
  '15. Concert passé gardé en envie : statut « Passé », non purgé ; passé gardé par personne : purgé',
  exists (select 1 from public.events where external_id = 'TEST-EV-5' and status = 'past')
  and not exists (select 1 from public.events where external_id = 'TEST-EV-4');

-- Trois imports COMPLETS où EV-3 et EV-6 manquent.
set local role service_role;
insert into t_out select 'finish1', public.finish_ticketmaster_sync(now() + interval '2 days', '2031-01-01', true, now());
insert into t_out select 'finish2', public.finish_ticketmaster_sync(now() + interval '3 days', '2031-01-01', true, now());
reset role;

insert into t_results (test, ok) select
  '16. Absent de 2 imports complets : pas encore retiré',
  exists (select 1 from public.events where external_id = 'TEST-EV-3' and missed_syncs = 2 and withdrawn_at is null);

set local role service_role;
insert into t_out select 'finish3', public.finish_ticketmaster_sync(now() + interval '4 days', '2031-01-01', true, now());
-- Un concert au-delà de la période importée n'a pas pu être vu : jamais compté absent.
insert into t_out select 'finish_court', public.finish_ticketmaster_sync(now() + interval '5 days', '2030-05-15', true, now());
reset role;

insert into t_results (test, ok) select
  '17. Absent de 3 imports complets : retiré ; hors période importée : pas compté',
  exists (select 1 from public.events where external_id = 'TEST-EV-3' and withdrawn_at is not null)
  and exists (select 1 from public.events where external_id = 'TEST-EV-6' and withdrawn_at is not null and missed_syncs = 3);

-- Visibilité : retiré invisible au public, visible pour qui l'a en envie.
set local role anon;
insert into t_results (test, ok) select
  '18. Visiteur : concerts retirés invisibles',
  not exists (select 1 from public.events where external_id in ('TEST-EV-3', 'TEST-EV-6'));
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-00000000000c","role":"authenticated"}', true);
insert into t_results (test, ok) select
  '19. Utilisateur : son envie retirée reste visible, l''autre concert retiré non',
  exists (select 1 from public.events where external_id = 'TEST-EV-3')
  and not exists (select 1 from public.events where external_id = 'TEST-EV-6');
reset role;

-- EV-3 revient chez la source.
set local role service_role;
insert into t_out select 'import5', public.import_ticketmaster_events(jsonb_build_array((select batch from t_batch3) -> 0), now());
reset role;

insert into t_results (test, ok) select
  '20. Concert revu chez la source : réaffiché, compteur remis à zéro',
  exists (select 1 from public.events where external_id = 'TEST-EV-3' and withdrawn_at is null and missed_syncs = 0);

-- Purge 60 jours plus tard (aucun nouvel import).
set local role service_role;
insert into t_out select 'finish_purge', public.finish_ticketmaster_sync(now() + interval '60 days', '2031-01-01', false, now() + interval '60 days');
reset role;

insert into t_results (test, ok) select
  '21. Purge : retiré depuis plus de 30 jours supprimé ; retiré mais en envie gardé',
  not exists (select 1 from public.events where external_id = 'TEST-EV-6')
  and exists (select 1 from public.events where external_id = 'TEST-EV-1' and withdrawn_at is not null);

insert into t_results (test, ok) select
  '22. Purge : artiste et salle orphelins supprimés ; artiste suivi gardé',
  not exists (select 1 from public.artists where external_id = 'TEST-AR-4')
  and not exists (select 1 from public.venues where external_id = 'TEST-VE-2')
  and exists (select 1 from public.artists where external_id = 'TEST-AR-1');

-- ===================== Depuis l'app : interdit =====================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-00000000000c","role":"authenticated"}', true);

do $$ begin
  perform public.import_ticketmaster_events('[]'::jsonb, now());
  insert into t_results (test, ok) values ('23. Un utilisateur connecté ne peut pas lancer l''import', false);
exception when insufficient_privilege then
  insert into t_results (test, ok) values ('23. Un utilisateur connecté ne peut pas lancer l''import', true);
end $$;

do $$ begin
  perform public.finish_ticketmaster_sync(now(), now(), true);
  insert into t_results (test, ok) values ('26. Un utilisateur connecté ne peut pas lancer la fin d''import (purge)', false);
exception when insufficient_privilege then
  insert into t_results (test, ok) values ('26. Un utilisateur connecté ne peut pas lancer la fin d''import (purge)', true);
end $$;

do $$ begin
  perform 1 from public.sync_runs limit 1;
  insert into t_results (test, ok) values ('24. Le journal de synchronisation est illisible depuis l''app', false);
exception when insufficient_privilege then
  insert into t_results (test, ok) values ('24. Le journal de synchronisation est illisible depuis l''app', true);
end $$;

reset role;
set local role anon;

do $$ begin
  perform public.import_ticketmaster_events('[]'::jsonb, now());
  insert into t_results (test, ok) values ('25. Un visiteur sans compte ne peut pas lancer l''import', false);
exception when insufficient_privilege then
  insert into t_results (test, ok) values ('25. Un visiteur sans compte ne peut pas lancer l''import', true);
end $$;

reset role;

-- Bilan + annulation de TOUT (erreur volontaire). Bilan compact : réussites, puis les échecs.
do $$ begin
  raise exception E'BILAN (transaction annulée, rien n''est enregistré) : %/% réussis%',
    (select count(*) filter (where ok) from t_results),
    (select count(*) from t_results),
    coalesce(
      E'\n' || (select string_agg('✗ ÉCHEC ' || test, E'\n' order by n) from t_results where not ok),
      ' ✓ — aucun échec'
    );
end $$;
