// Formatage des valeurs affichées (prix, rôles, source, initiales).

import type { Database } from '@/types/database';

export type ArtistRole = Database['public']['Enums']['artist_role'];
export type DataSource = Database['public']['Enums']['data_source'];

export const roleLabels: Record<ArtistRole, string> = {
  headliner: 'Tête d’affiche',
  co_headliner: 'Co-tête d’affiche',
  support: 'Première partie',
  guest: 'Invité',
};

// Mention de source obligatoire sur la fiche concert.
export const sourceLabels: Record<DataSource, string> = {
  demo: 'Données de démonstration',
  ticketmaster: 'Source : Ticketmaster',
  user: 'Ajouté par un utilisateur',
};

/**
 * Prix indicatif : « 39 € », « De 39 € à 55 € », « À partir de 39 € », « Jusqu’à 55 € »,
 * ou null si aucun prix n'est renseigné.
 */
export function formatPriceRange(
  min: number | null,
  max: number | null,
  currency: string,
): string | null {
  const format = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);

  if (min !== null && max !== null) {
    return min === max ? format(min) : `De ${format(min)} à ${format(max)}`;
  }
  if (min !== null) return `À partir de ${format(min)}`;
  if (max !== null) return `Jusqu’à ${format(max)}`;
  return null;
}

/** Initiales d'un artiste : « So La Lune » → « SL », « Gazo » → « GA ». */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2 ? `${words[0][0]}${words[1][0]}` : (words[0] ?? '').slice(0, 2);
  return initials.toUpperCase();
}
