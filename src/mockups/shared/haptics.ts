import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Retours haptiques des prototypes. Ignorés sur le web et en cas d'erreur (appareil sans moteur).
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

function run(effect: () => Promise<void>) {
  if (!isNative) return;
  effect().catch(() => undefined);
}

export const haptics = {
  /** Appui léger (ouvrir une carte). */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Changement de sélection (carrousel, onglet). */
  select: () => run(() => Haptics.selectionAsync()),
  /** Choc franc (tampon, sticker). */
  thud: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  /** Action réussie (envie ajoutée). */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
