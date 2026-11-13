import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes, spacing } from '@/theme/tokens';

/**
 * Espace à laisser en bas d'un contenu défilant d'écran d'onglet, pour que le dernier
 * élément ne reste pas caché sous la barre d'onglets.
 * iOS : la barre flotte au-dessus du contenu (hauteur + zone sûre + marge).
 * Android : la barre ne recouvre pas le contenu (simple marge).
 */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios'
    ? insets.bottom + sizes.tabBarClearance + spacing.lg
    : spacing.xxl;
}
