import { createContext, useContext, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthContext';
import type { Coordinates } from '@/features/filters/filters';
import { useMainCity } from '@/features/preferences/usePreferences';

import { locateUser, type LocateFailure } from './location';
import { loadSavedCity, saveCity, type SavedCity } from './storage';

/** Lieu de référence de « Près de chez toi » : une ville (avec son rayon), ou la position de la session. */
export type NearbyPlace =
  | { kind: 'city'; cityId: string; name: string; radiusKm?: number; isMain?: boolean }
  | { kind: 'position'; position: Coordinates };

/** Rayon par défaut de « Près de chez toi ». */
export const NEARBY_RADIUS_KM = 50;

type NearbyContextValue = {
  /** Lieu effectif : choix de la session > ville principale du compte > ville mémorisée. */
  place: NearbyPlace | null;
  /** Rayon effectif (celui de la ville principale, sinon 50 km). */
  radiusKm: number;
  /** Vrai si un choix peut être effacé (sinon, on est déjà sur la ville principale ou sur rien). */
  canClear: boolean;
  isLocating: boolean;
  /** Raison du dernier échec de localisation (null si aucun). */
  locateError: LocateFailure | null;
  /** Demande la position (uniquement sur action de l'utilisateur). */
  locate: () => Promise<void>;
  /** Choisit une ville (mémorisée sur le téléphone pour le prochain lancement). */
  chooseCity: (city: SavedCity) => void;
  /** Efface le choix (et la ville mémorisée) : retour à la ville principale s'il y en a une. */
  clear: () => void;
};

const NearbyContext = createContext<NearbyContextValue | null>(null);

// Fournit le lieu de « Près de chez toi » à toute l'application.
// Priorité : 1. choix fait pendant la session (position ou ville) ; 2. ville principale du compte
// (V1.3) ; 3. ville mémorisée sur le téléphone (V1.2). La position n'est jamais enregistrée.
export function NearbyProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const { mainCity } = useMainCity();

  const [savedCity, setSavedCity] = useState<SavedCity | null>(() => loadSavedCity());
  // Choix de la session, rattaché au compte qui l'a fait : oublié si l'on change de compte.
  const [session, setSession] = useState<{ ownerId: string | null; place: NearbyPlace } | null>(
    null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<LocateFailure | null>(null);

  const sessionPlace = session && session.ownerId === userId ? session.place : null;
  const mainPlace: NearbyPlace | null =
    userId && mainCity
      ? {
          kind: 'city',
          cityId: mainCity.city_id,
          name: mainCity.city.name,
          radiusKm: mainCity.radius_km,
          isMain: true,
        }
      : null;
  const savedPlace: NearbyPlace | null = savedCity ? { kind: 'city', ...savedCity } : null;

  const place = sessionPlace ?? mainPlace ?? savedPlace;
  const radiusKm =
    place?.kind === 'city' && place.radiusKm !== undefined ? place.radiusKm : NEARBY_RADIUS_KM;
  const canClear = sessionPlace !== null || (mainPlace === null && savedPlace !== null);

  const locate = async () => {
    setIsLocating(true);
    setLocateError(null);
    const result = await locateUser();
    setIsLocating(false);
    if (result.ok) {
      setSession({ ownerId: userId, place: { kind: 'position', position: result.position } });
    } else {
      setLocateError(result.reason);
    }
  };

  const chooseCity = (city: SavedCity) => {
    saveCity(city);
    setSavedCity(city);
    setLocateError(null);
    setSession({ ownerId: userId, place: { kind: 'city', ...city } });
  };

  const clear = () => {
    saveCity(null);
    setSavedCity(null);
    setLocateError(null);
    setSession(null);
  };

  return (
    <NearbyContext.Provider
      value={{ place, radiusKm, canClear, isLocating, locateError, locate, chooseCity, clear }}>
      {children}
    </NearbyContext.Provider>
  );
}

export function useNearby(): NearbyContextValue {
  const value = useContext(NearbyContext);
  if (!value) {
    throw new Error('useNearby doit être utilisé à l’intérieur de NearbyProvider.');
  }
  return value;
}
