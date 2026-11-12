// Localisation ponctuelle (« Me localiser »), selon les garde-fous de docs/v1.2.md :
// demandée uniquement sur action de l'utilisateur, au premier plan, précision faible,
// arrondie à ~1 km, jamais enregistrée.

import * as Location from 'expo-location';

import { roundCoordinate, type Coordinates } from '@/features/filters/filters';

const TIMEOUT_MS = 15_000;

/** Raison d'un échec, pour afficher le bon message. */
export type LocateFailure =
  | 'denied' // refus, la question pourra être reposée
  | 'blocked' // refus définitif : seuls les réglages du téléphone permettent de changer
  | 'services-off' // localisation désactivée sur le téléphone
  | 'unavailable'; // délai dépassé ou erreur

export type LocateResult = { ok: true; position: Coordinates } | { ok: false; reason: LocateFailure };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function locateUser(): Promise<LocateResult> {
  try {
    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      // Ne pas redemander si le téléphone l'interdit (refus définitif).
      if (!permission.canAskAgain) return { ok: false, reason: 'blocked' };
      permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        return { ok: false, reason: permission.canAskAgain ? 'denied' : 'blocked' };
      }
    }

    if (!(await Location.hasServicesEnabledAsync())) {
      return { ok: false, reason: 'services-off' };
    }

    const location = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
      TIMEOUT_MS,
    );
    return {
      ok: true,
      position: {
        latitude: roundCoordinate(location.coords.latitude),
        longitude: roundCoordinate(location.coords.longitude),
      },
    };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** Messages affichés en cas d'échec. */
export const locateFailureMessages: Record<LocateFailure, string> = {
  denied: 'Localisation refusée. Tu peux choisir une ville à la place.',
  blocked:
    'La localisation est désactivée pour cette app. Tu peux l’autoriser dans les réglages du téléphone, ou choisir une ville.',
  'services-off':
    'La localisation est désactivée sur ton téléphone. Active-la dans les réglages, ou choisis une ville.',
  unavailable: 'Impossible de te localiser pour le moment. Réessaie, ou choisis une ville.',
};
