-- V1.1, étape 5 : import Ticketmaster planifié chaque nuit.
--
-- - pg_cron déclenche la tâche chaque nuit à 03:00 UTC (4 h à Paris en hiver, 5 h en été : heure
--   creuse) ;
-- - pg_net appelle la fonction sync-ticketmaster (import complet sur 6 mois) ;
-- - l'adresse du projet et le secret partagé sont lus dans le coffre de Supabase (Vault) au moment
--   de l'appel : aucune valeur secrète dans ce fichier ni dans Git.
--
-- Secrets attendus dans Vault (créés une fois, hors migration) :
--   project_url : https://<ref>.supabase.co   (pas secret, mais propre à chaque projet)
--   sync_secret : même valeur que le secret SYNC_SECRET de la fonction
-- Si l'un manque, l'appel échoue et l'échec est visible dans le suivi (voir README).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Lance un import Ticketmaster (utilisée par la tâche planifiée, et à la main si besoin).
-- Renvoie l'identifiant de la requête pg_net (réponse consultable dans net._http_response).
create function public.trigger_ticketmaster_sync(p_months integer default 6)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'sync_secret';
  if v_url is null or v_secret is null then
    raise exception 'Secrets Vault manquants (project_url, sync_secret)' using errcode = 'P0002';
  end if;

  return net.http_post(
    url := v_url || '/functions/v1/sync-ticketmaster',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-secret', v_secret),
    body := jsonb_build_object('months', p_months),
    -- La fonction peut tourner plus d'une minute : on attend sa réponse jusqu'à 150 s.
    timeout_milliseconds := 150000
  );
end;
$$;

comment on function public.trigger_ticketmaster_sync(integer) is
  'Lance l''import Ticketmaster (secrets lus dans Vault). Tâche planifiée et usage manuel ; jamais depuis l''app.';

revoke execute on function public.trigger_ticketmaster_sync(integer) from public, anon, authenticated;
grant execute on function public.trigger_ticketmaster_sync(integer) to service_role;

-- Tâche planifiée (recréée à l'identique si la migration est rejouée : même nom = mise à jour).
select cron.schedule(
  'sync-ticketmaster-nightly',
  '0 3 * * *',
  $$select public.trigger_ticketmaster_sync(6);$$
);
