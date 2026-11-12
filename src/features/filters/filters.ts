// Modèle des filtres de l'écran « Concerts » (V1.2) et lecture depuis l'adresse de l'écran
// (ex. /concerts?city=…&genres=…&date=week&radius=50, ou ?lat=47.22&lng=-1.55&radius=50).

import type { DatePreset } from '@/lib/dates';
import { isUuid } from '@/lib/ids';

export const RADIUS_OPTIONS = [10, 25, 50, 100] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS)[number];

/** Position approximative de l'utilisateur (arrondie à ~1 km, jamais enregistrée). */
export type Coordinates = { latitude: number; longitude: number };

export type EventFilters = {
  date: DatePreset;
  cityId: string | null;
  /** Position de l'utilisateur (« Autour de moi ») : remplace la ville comme point de référence. */
  position: Coordinates | null;
  genreIds: string[];
  /** null = ville uniquement (pas de rayon). */
  radiusKm: RadiusKm | null;
};

export const EMPTY_FILTERS: EventFilters = {
  date: 'all',
  cityId: null,
  position: null,
  genreIds: [],
  radiusKm: null,
};

const DATE_PRESETS: readonly DatePreset[] = ['all', 'today', 'weekend', 'week', 'month'];

/** Arrondi à 2 décimales (~1 km) : la position précise n'est jamais utilisée. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Paramètres d'adresse acceptés par l'écran « Concerts ». */
export type FilterParams = {
  date?: string;
  city?: string;
  genres?: string;
  radius?: string;
  lat?: string;
  lng?: string;
};

function parseCoordinates(lat?: string, lng?: string): Coordinates | null {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (lat === undefined || lng === undefined || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude: roundCoordinate(latitude), longitude: roundCoordinate(longitude) };
}

/** Lit les filtres depuis l'adresse ; toute valeur invalide est ignorée. */
export function parseFilterParams(params: FilterParams): EventFilters {
  const date = DATE_PRESETS.find((preset) => preset === params.date) ?? 'all';
  const position = parseCoordinates(params.lat, params.lng);
  // Une position remplace la ville.
  const cityId = !position && isUuid(params.city) ? params.city : null;
  const genreIds = (params.genres ?? '').split(',').filter((id) => isUuid(id));
  const radius = RADIUS_OPTIONS.find((value) => String(value) === params.radius) ?? null;
  // Une position sans rayon ne filtrerait rien : 50 km par défaut (comme « Près de chez toi »).
  const radiusKm = position && radius === null ? 50 : radius;
  return { date, cityId, position, genreIds, radiusKm };
}

/** Nombre de filtres actifs (pour afficher « Réinitialiser (n) »). Ville ou position = un seul filtre « lieu ». */
export function countActiveFilters(filters: EventFilters): number {
  return (
    (filters.date !== 'all' ? 1 : 0) +
    (filters.cityId || filters.position ? 1 : 0) +
    (filters.genreIds.length > 0 ? 1 : 0) +
    (filters.radiusKm !== null ? 1 : 0)
  );
}
