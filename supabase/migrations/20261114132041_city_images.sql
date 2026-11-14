-- V1.3.2 : photos des villes (tuiles « Villes » de Découvrir et de la Recherche).
--
-- Les photos viennent de Wikimedia Commons (licences libres) et sont copiées dans Supabase Storage,
-- bucket public « city-images » : l'app ne charge rien depuis un site externe, et les images
-- s'affichent aussi sur Android (Wikimedia refuse les clients sans en-tête User-Agent explicite).

-- ---------------------------------------------------------------------------
-- Colonnes de la table cities (catalogue : lecture publique seule, RLS inchangée)
-- ---------------------------------------------------------------------------

alter table public.cities
  add column image_path text,       -- chemin du fichier dans le bucket « city-images » (ex. 'nantes.jpg')
  add column image_credit text,     -- auteur et licence, affichés dans Infos › Crédits photos
  add column image_source_url text; -- page de la photo sur Wikimedia Commons

comment on column public.cities.image_path is
  'Photo de la ville : chemin dans le bucket Storage public « city-images ».';
comment on column public.cities.image_credit is
  'Crédit de la photo (auteur · licence), affiché dans la page Infos.';
comment on column public.cities.image_source_url is
  'Page d’origine de la photo (Wikimedia Commons).';

-- ---------------------------------------------------------------------------
-- Bucket public des photos de villes : lecture par tous via l'URL publique,
-- aucune écriture depuis l'app (pas de politique d'écriture sur storage.objects).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('city-images', 'city-images', true, 1048576, array['image/jpeg'])
on conflict (id) do nothing;
