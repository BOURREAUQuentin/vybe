import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** Crédits des photos de villes (V1.3.2) : ville, auteur · licence, page d'origine. */
export async function fetchPhotoCredits() {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name, image_credit, image_source_url')
    .not('image_credit', 'is', null)
    .order('name');

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export type PhotoCredit = Awaited<ReturnType<typeof fetchPhotoCredits>>[number];

/** Crédits photos de la page Infos (données publiques du catalogue, mises en cache). */
export function usePhotoCredits() {
  return useQuery({
    queryKey: ['infos', 'photo-credits'],
    queryFn: fetchPhotoCredits,
  });
}
