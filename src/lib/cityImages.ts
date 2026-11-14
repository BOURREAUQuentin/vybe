import { supabase } from '@/lib/supabase';

/** Bucket Storage public qui contient les photos des villes (V1.3.2). */
const CITY_IMAGES_BUCKET = 'city-images';

/**
 * URL publique de la photo d'une ville, à partir de son chemin dans le bucket (colonne
 * `cities.image_path`), ou null s'il n'y en a pas. Aucun appel réseau : l'URL est construite
 * à partir de l'adresse du projet Supabase.
 */
export function cityImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  return supabase.storage.from(CITY_IMAGES_BUCKET).getPublicUrl(imagePath).data.publicUrl;
}
