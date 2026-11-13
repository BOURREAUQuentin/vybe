// Indicateur « onboarding déjà proposé », par compte, gardé sur le téléphone :
// évite de reproposer « Suis quelques artistes » à chaque connexion.

import Storage from 'expo-sqlite/kv-store';

const key = (userId: string) => `vybe.onboarding.seen.${userId}`;

export function hasSeenOnboarding(userId: string): boolean {
  try {
    return Storage.getItemSync(key(userId)) === '1';
  } catch {
    return false;
  }
}

/** Efface l'indicateur (ex. après la suppression du compte). */
export function clearOnboardingSeen(userId: string): void {
  try {
    Storage.removeItemSync(key(userId));
  } catch {
    // Stockage indisponible : sans conséquence.
  }
}

export function markOnboardingSeen(userId: string): void {
  try {
    Storage.setItemSync(key(userId), '1');
  } catch {
    // Stockage indisponible : l'onboarding pourra être reproposé, sans gravité.
  }
}
