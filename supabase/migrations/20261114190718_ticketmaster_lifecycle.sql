-- V1.1, étape 4 : cycle de vie des concerts importés (passés, retirés, purge).
--
-- - events.missed_syncs / withdrawn_at : un concert à venir absent de 3 imports COMPLETS d'affilée
--   est « retiré » : il disparaît du catalogue, mais reste visible dans les envies de ceux qui
--   l'avaient enregistré ; il réapparaît automatiquement s'il revient chez la source ;
-- - finish_ticketmaster_sync(...) : appelée à la fin de chaque import (concerts passés, retraits,
--   purge des données de plus de 30 jours, sauf ce que des utilisateurs gardent) ;
-- - import_ticketmaster_events : remet à zéro le compteur d'absences d'un concert revu.

-- ---------------------------------------------------------------------------
-- Colonnes
-- ---------------------------------------------------------------------------

alter table public.events
  add column missed_syncs smallint not null default 0 check (missed_syncs >= 0),
  add column withdrawn_at timestamptz;

comment on column public.events.missed_syncs is
  'Nombre d''imports complets d''affilée où ce concert à venir manquait chez la source (V1.1).';
comment on column public.events.withdrawn_at is
  'Retiré par la source (absent de 3 imports complets) : masqué du catalogue, visible dans les envies (V1.1).';

alter table public.sync_runs
  add column events_purged integer not null default 0 check (events_purged >= 0);

comment on column public.sync_runs.events_removed is 'Concerts retirés (absents de 3 imports complets) lors de cet import.';
comment on column public.sync_runs.events_purged is 'Concerts supprimés (passés ou retirés depuis plus de 30 jours, gardés par personne).';

-- ---------------------------------------------------------------------------
-- Lecture des événements : un concert retiré reste visible pour qui l'a dans ses envies.
-- ---------------------------------------------------------------------------

-- Vrai si le concert est dans les envies de l'utilisateur connecté (faux sans compte).
-- security definer : la règle de lecture des concerts s'applique aussi aux visiteurs, qui n'ont
-- aucun droit sur user_events ; la fonction ne révèle que les envies de l'appelant (auth.uid()).
create function public.is_in_my_wishlist(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_events ue
    where ue.event_id = p_event_id and ue.user_id = auth.uid()
  );
$$;

revoke execute on function public.is_in_my_wishlist(uuid) from public;
grant execute on function public.is_in_my_wishlist(uuid) to anon, authenticated, service_role;

drop policy "Lecture publique des événements visibles" on public.events;

create policy "Lecture publique des événements visibles" on public.events
  for select to anon, authenticated
  using (not is_hidden and (withdrawn_at is null or public.is_in_my_wishlist(id)));

-- ---------------------------------------------------------------------------
-- Import : un concert revu n'est plus retiré
-- ---------------------------------------------------------------------------

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

  return jsonb_build_object('created', v_created, 'updated', v_updated);
end;
$$;

-- ---------------------------------------------------------------------------
-- Fin d'import : concerts passés, retraits, purge
-- ---------------------------------------------------------------------------
--
-- p_seen_at : début de l'import (les concerts vus ont last_seen_at = p_seen_at) ;
-- p_until : fin de la période importée (un concert au-delà n'a pas pu être vu : jamais compté absent) ;
-- p_complete : l'import s'est terminé sans aucune erreur. Sinon, AUCUN retrait n'est calculé
--   (un import interrompu ne doit jamais vider le catalogue) ; le reste s'applique ;
-- p_now : instant de référence (paramètre pour les tests ; défaut : maintenant).
--
-- Renvoie {"past", "withdrawn", "purged_events", "purged_artists", "purged_venues"}.

create function public.finish_ticketmaster_sync(
  p_seen_at timestamptz,
  p_until timestamptz,
  p_complete boolean,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_retention constant interval := interval '30 days';
  v_missed_limit constant smallint := 3;
  v_past integer := 0;
  v_withdrawn integer := 0;
  v_purged_events integer := 0;
  v_purged_artists integer := 0;
  v_purged_venues integer := 0;
begin
  -- 1. Concerts dont la date est passée.
  update public.events
  set status = 'past'
  where source = 'ticketmaster' and starts_at < p_now and status <> 'past';
  get diagnostics v_past = row_count;

  -- 2. Absences et retraits (seulement après un import complet).
  if p_complete then
    update public.events
    set missed_syncs = least(missed_syncs + 1, 32767)
    where source = 'ticketmaster'
      and starts_at >= p_now
      and starts_at < p_until
      and withdrawn_at is null
      and (last_seen_at is null or last_seen_at < p_seen_at);

    update public.events
    set withdrawn_at = p_now
    where source = 'ticketmaster' and withdrawn_at is null and missed_syncs >= v_missed_limit;
    get diagnostics v_withdrawn = row_count;
  end if;

  -- 3. Purge : passés ou retirés depuis plus de 30 jours, gardés dans les envies de personne.
  delete from public.events e
  where e.source = 'ticketmaster'
    and (e.starts_at < p_now - v_retention or e.withdrawn_at < p_now - v_retention)
    and not exists (select 1 from public.user_events ue where ue.event_id = e.id);
  get diagnostics v_purged_events = row_count;

  -- Artistes et salles orphelins : plus aucun concert, suivis par personne, pas revus depuis 30 jours
  -- (updated_at est rafraîchi à chaque import qui les mentionne).
  delete from public.artists a
  where a.source = 'ticketmaster'
    and a.updated_at < p_now - v_retention
    and not exists (select 1 from public.event_artists ea where ea.artist_id = a.id)
    and not exists (select 1 from public.user_artist_follows f where f.artist_id = a.id);
  get diagnostics v_purged_artists = row_count;

  delete from public.venues v
  where v.source = 'ticketmaster'
    and v.updated_at < p_now - v_retention
    and not exists (select 1 from public.events e where e.venue_id = v.id)
    and not exists (select 1 from public.user_venue_follows f where f.venue_id = v.id);
  get diagnostics v_purged_venues = row_count;

  return jsonb_build_object(
    'past', v_past,
    'withdrawn', v_withdrawn,
    'purged_events', v_purged_events,
    'purged_artists', v_purged_artists,
    'purged_venues', v_purged_venues
  );
end;
$$;

comment on function public.finish_ticketmaster_sync(timestamptz, timestamptz, boolean, timestamptz) is
  'Fin d''import Ticketmaster : concerts passés, retraits (3 absences), purge à 30 jours. Serveur uniquement.';

revoke execute on function public.finish_ticketmaster_sync(timestamptz, timestamptz, boolean, timestamptz)
  from public, anon, authenticated;
grant execute on function public.finish_ticketmaster_sync(timestamptz, timestamptz, boolean, timestamptz)
  to service_role;
