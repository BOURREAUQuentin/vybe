-- V1.1 : le journal d'import compte les VRAIS changements chez Ticketmaster (statut ou date d'un
-- concert déjà connu), avec quelques exemples. « updated » compte tous les concerts revus (presque
-- tout le catalogue chaque nuit) : il ne permet pas de voir une modification réelle. Ce compteur
-- sert au critère « une modification est répercutée » et servira aux notifications (V1.4).

alter table public.sync_runs
  add column events_changed integer not null default 0 check (events_changed >= 0),
  add column changes jsonb not null default '[]'::jsonb;

comment on column public.sync_runs.events_changed is
  'Concerts déjà connus dont le statut ou la date a changé chez la source lors de cet import.';
comment on column public.sync_runs.changes is
  'Exemples de changements (nom, ancien et nouveau statut, ancienne et nouvelle date), 20 au maximum.';

-- import_ticketmaster_events renvoie désormais aussi "changed" et "samples" (10 exemples par lot).
-- Les droits (service_role uniquement) sont conservés par « create or replace ».
create or replace function public.import_ticketmaster_events(p_events jsonb, p_seen_at timestamptz default now())
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  e jsonb;
  a jsonb;
  v_city_id uuid;
  v_venue_id uuid;
  v_artist_id uuid;
  v_event_id uuid;
  v_inserted boolean;
  v_artist_ids uuid[];
  v_position smallint;
  v_created integer := 0;
  v_updated integer := 0;
  -- Suivi des vrais changements (statut ou date) d'un concert déjà connu.
  v_old_status public.event_status;
  v_old_starts_at timestamptz;
  v_changed integer := 0;
  v_samples jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'import_ticketmaster_events : un tableau JSON est attendu' using errcode = '22023';
  end if;

  for e in select * from jsonb_array_elements(p_events) loop
    -- Ville et salle (facultatives : un événement sans salle, ou sans ville connue, reste importable).
    v_venue_id := null;
    if jsonb_typeof(e -> 'venue') = 'object'
       and e #>> '{venue,external_id}' is not null
       and e #>> '{venue,city,name}' is not null then
      insert into public.cities (name, country_code, latitude, longitude)
      values (
        e #>> '{venue,city,name}',
        coalesce(e #>> '{venue,city,country_code}', 'FR'),
        (e #>> '{venue,latitude}')::double precision,
        (e #>> '{venue,longitude}')::double precision
      )
      on conflict (name, country_code) do update
        -- Coordonnées d'une ville créée sans position : complétées dès qu'une salle en donne.
        set latitude = coalesce(public.cities.latitude, excluded.latitude),
            longitude = coalesce(public.cities.longitude, excluded.longitude)
      returning id into v_city_id;

      insert into public.venues (name, city_id, address, postal_code, latitude, longitude, url, source, external_id)
      values (
        e #>> '{venue,name}',
        v_city_id,
        e #>> '{venue,address}',
        e #>> '{venue,postal_code}',
        (e #>> '{venue,latitude}')::double precision,
        (e #>> '{venue,longitude}')::double precision,
        e #>> '{venue,url}',
        'ticketmaster',
        e #>> '{venue,external_id}'
      )
      on conflict (source, external_id) do update
        set name = excluded.name,
            city_id = excluded.city_id,
            address = coalesce(excluded.address, public.venues.address),
            postal_code = coalesce(excluded.postal_code, public.venues.postal_code),
            latitude = coalesce(excluded.latitude, public.venues.latitude),
            longitude = coalesce(excluded.longitude, public.venues.longitude),
            url = coalesce(excluded.url, public.venues.url)
      returning id into v_venue_id;
    end if;

    -- Valeurs avant l'import (aucune ligne : concert nouveau, variables à null).
    select status, starts_at into v_old_status, v_old_starts_at
    from public.events
    where source = 'ticketmaster' and external_id = e ->> 'external_id';

    -- Événement (le statut « masqué » posé à la main n'est jamais modifié par l'import).
    insert into public.events (
      name, type, status, venue_id, genre_id, starts_at, time_tba, on_sale_at, ticket_url,
      price_min, price_max, currency, image_url, source, external_id, last_seen_at
    )
    values (
      e ->> 'name',
      coalesce((e ->> 'type')::public.event_type, 'concert'),
      coalesce((e ->> 'status')::public.event_status, 'announced'),
      v_venue_id,
      public.resolve_genre('ticketmaster', e ->> 'genre', e ->> 'sub_genre'),
      (e ->> 'starts_at')::timestamptz,
      coalesce((e ->> 'time_tba')::boolean, false),
      (e ->> 'on_sale_at')::timestamptz,
      e ->> 'ticket_url',
      (e ->> 'price_min')::numeric,
      (e ->> 'price_max')::numeric,
      coalesce(e ->> 'currency', 'EUR'),
      e ->> 'image_url',
      'ticketmaster',
      e ->> 'external_id',
      p_seen_at
    )
    on conflict (source, external_id) do update
      set name = excluded.name,
          type = excluded.type,
          status = excluded.status,
          venue_id = coalesce(excluded.venue_id, public.events.venue_id),
          genre_id = coalesce(excluded.genre_id, public.events.genre_id),
          starts_at = excluded.starts_at,
          time_tba = excluded.time_tba,
          on_sale_at = excluded.on_sale_at,
          ticket_url = excluded.ticket_url,
          price_min = excluded.price_min,
          price_max = excluded.price_max,
          currency = excluded.currency,
          image_url = coalesce(excluded.image_url, public.events.image_url),
          last_seen_at = excluded.last_seen_at,
          -- Revu chez la source : il n'est plus considéré comme retiré (étape 4).
          missed_syncs = 0,
          withdrawn_at = null
    -- xmax = 0 : la ligne vient d'être insérée (sinon c'est une mise à jour).
    returning id, (xmax = 0) into v_event_id, v_inserted;

    if v_inserted then
      v_created := v_created + 1;
    else
      v_updated := v_updated + 1;
      -- Vrai changement chez la source : statut ou date (10 exemples gardés pour le journal).
      if v_old_status is distinct from coalesce((e ->> 'status')::public.event_status, 'announced')
         or v_old_starts_at is distinct from (e ->> 'starts_at')::timestamptz then
        v_changed := v_changed + 1;
        if jsonb_array_length(v_samples) < 10 then
          v_samples := v_samples || jsonb_build_object(
            'external_id', e ->> 'external_id',
            'name', e ->> 'name',
            'old_status', v_old_status,
            'new_status', coalesce(e ->> 'status', 'announced'),
            'old_starts_at', v_old_starts_at,
            'new_starts_at', (e ->> 'starts_at')::timestamptz
          );
        end if;
      end if;
    end if;

    -- Artistes et line-up, dans l'ordre de l'affiche.
    v_artist_ids := '{}';
    v_position := 0;
    for a in select * from jsonb_array_elements(coalesce(e -> 'attractions', '[]'::jsonb)) loop
      insert into public.artists (name, image_url, genre_id, url, source, external_id)
      values (
        a ->> 'name',
        a ->> 'image_url',
        public.resolve_genre('ticketmaster', a ->> 'genre', a ->> 'sub_genre'),
        a ->> 'url',
        'ticketmaster',
        a ->> 'external_id'
      )
      on conflict (source, external_id) do update
        set name = excluded.name,
            image_url = coalesce(excluded.image_url, public.artists.image_url),
            genre_id = coalesce(excluded.genre_id, public.artists.genre_id),
            url = coalesce(excluded.url, public.artists.url)
      returning id into v_artist_id;

      -- Un artiste listé deux fois par la source n'est compté qu'une fois.
      if not v_artist_id = any (v_artist_ids) then
        insert into public.event_artists (event_id, artist_id, role, position)
        values (
          v_event_id,
          v_artist_id,
          case when v_position = 0 then 'headliner'::public.artist_role else 'support'::public.artist_role end,
          v_position
        )
        on conflict (event_id, artist_id) do update
          set role = excluded.role,
              position = excluded.position;
        v_artist_ids := v_artist_ids || v_artist_id;
        v_position := v_position + 1;
      end if;
    end loop;

    -- Artistes retirés de l'affiche par la source.
    delete from public.event_artists
    where event_id = v_event_id
      and not (artist_id = any (v_artist_ids));
  end loop;

  return jsonb_build_object('created', v_created, 'updated', v_updated, 'changed', v_changed, 'samples', v_samples);
end;
$$;
