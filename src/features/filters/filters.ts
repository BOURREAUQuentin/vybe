// Modèle des filtres de l'écran « Tous les concerts » (V1.2) et lecture depuis l'adresse
// de l'écran (ex. /concerts?city=…&genres=…&date=week&radius=50).

import type { DatePreset } from '@/lib/dates';
import { isUuid } from '@/lib/ids';

export const RADIUS_OPTIONS = [10, 25, 50, 100] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS)[number];

export type EventFilters = {
  date: DatePreset;
  cityId: string | null;
  genreIds: string[];
  /** null = ville uniquement (pas de rayon). */
  radiusKm: RadiusKm | null;
};

export const EMPTY_FILTERS: EventFilters = {
  date: 'all',
  cityId: null,
  genreIds: [],
  radiusKm: null,
};

const DATE_PRESETS: readonly DatePreset[] = ['all', 'today', 'weekend', 'week', 'month'];

/** Paramètres d'adresse acceptés par l'écran « Tous les concerts ». */
export type FilterParams = {
  date?: string;
  city?: string;
  genres?: string;
  radius?: string;
};

/** Lit les filtres depuis l'adresse ; toute valeur invalide est ignorée. */
export function parseFilterParams(params: FilterParams): EventFilters {
  const date = DATE_PRESETS.find((preset) => preset === params.date) ?? 'all';
  const cityId = isUuid(params.city) ? params.city : null;
  const genreIds = (params.genres ?? '').split(',').filter((id) => isUuid(id));
  const radiusKm = RADIUS_OPTIONS.find((radius) => String(radius) === params.radius) ?? null;
  return { date, cityId, genreIds, radiusKm };
}

/** Nombre de filtres actifs (pour afficher « Réinitialiser »). */
export function countActiveFilters(filters: EventFilters): number {
  return (
    (filters.date !== 'all' ? 1 : 0) +
    (filters.cityId ? 1 : 0) +
    (filters.genreIds.length > 0 ? 1 : 0) +
    (filters.radiusKm !== null ? 1 : 0)
  );
}
