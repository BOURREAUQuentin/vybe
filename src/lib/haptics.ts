import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Retours haptiques (vibrations légères). Ignorés sur le web et si l'appareil n'en a pas.
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

function run(effect: () => Promise<void>) {
  if (!isNative) return;
  effect().catch(() => undefined);
}

export const haptics = {
  /** Appui léger : ouvrir une carte, une fiche. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Changement de sélection : carrousel aligné, choix d'un filtre. */
  select: () => run(() => Haptics.selectionAsync()),
  /** Action réussie : envie ajoutée, artiste suivi. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
