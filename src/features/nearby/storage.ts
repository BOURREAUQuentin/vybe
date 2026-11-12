// Mémorisation de la VILLE choisie pour « Près de chez toi » (stockage local du téléphone).
// La position de l'utilisateur n'est jamais enregistrée ici (règle 7 de CLAUDE.md).

import Storage from 'expo-sqlite/kv-store';

import { isUuid } from '@/lib/ids';

const CITY_KEY = 'vybe.nearby.city';

export type SavedCity = { cityId: string; name: string };

/** Ville retenue au lancement précédent, ou null. Ne plante jamais. */
export function loadSavedCity(): SavedCity | null {
  try {
    const raw = Storage.getItemSync(CITY_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      'cityId' in value &&
      'name' in value &&
      typeof value.cityId === 'string' &&
      typeof value.name === 'string' &&
      isUuid(value.cityId)
    ) {
      return { cityId: value.cityId, name: value.name };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCity(city: SavedCity | null): void {
  try {
    if (city) Storage.setItemSync(CITY_KEY, JSON.stringify(city));
    else Storage.removeItemSync(CITY_KEY);
  } catch {
    // Stockage indisponible : le choix sera simplement oublié au prochain lancement.
  }
}
