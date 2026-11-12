import { createContext, useContext, useState, type ReactNode } from 'react';

import type { Coordinates } from '@/features/filters/filters';

import { locateUser, type LocateFailure } from './location';
import { loadSavedCity, saveCity, type SavedCity } from './storage';

/** Lieu de référence de « Près de chez toi » : une ville choisie, ou la position de la session. */
export type NearbyPlace =
  | { kind: 'city'; cityId: string; name: string }
  | { kind: 'position'; position: Coordinates };

/** Rayon utilisé par « Près de chez toi ». */
export const NEARBY_RADIUS_KM = 50;

type NearbyContextValue = {
  place: NearbyPlace | null;
  isLocating: boolean;
  /** Raison du dernier échec de localisation (null si aucun). */
  locateError: LocateFailure | null;
  /** Demande la position (uniquement sur action de l'utilisateur). */
  locate: () => Promise<void>;
  /** Choisit une ville (mémorisée pour le prochain lancement). */
  chooseCity: (city: SavedCity) => void;
  /** Efface le lieu choisi (et la ville mémorisée). */
  clear: () => void;
};

const NearbyContext = createContext<NearbyContextValue | null>(null);

// Fournit le lieu de « Près de chez toi » à toute l'application.
// La position reste en mémoire le temps de la session : elle n'est jamais enregistrée.
export function NearbyProvider({ children }: { children: ReactNode }) {
  const [place, setPlace] = useState<NearbyPlace | null>(() => {
    const saved = loadSavedCity();
    return saved ? { kind: 'city', ...saved } : null;
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<LocateFailure | null>(null);

  const locate = async () => {
    setIsLocating(true);
    setLocateError(null);
    const result = await locateUser();
    setIsLocating(false);
    if (result.ok) {
      setPlace({ kind: 'position', position: result.position });
    } else {
      setLocateError(result.reason);
    }
  };

  const chooseCity = (city: SavedCity) => {
    saveCity(city);
    setLocateError(null);
    setPlace({ kind: 'city', ...city });
  };

  const clear = () => {
    saveCity(null);
    setLocateError(null);
    setPlace(null);
  };

  return (
    <NearbyContext.Provider value={{ place, isLocating, locateError, locate, chooseCity, clear }}>
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
