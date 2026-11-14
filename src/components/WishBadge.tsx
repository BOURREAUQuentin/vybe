import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { colors, iconSizes, radius, sizes } from '@/theme/tokens';

// Rond blanc avec un cœur, dans le coin d'une photo (carrousel, grand visuel) : concert dans les envies.
// Décoratif : l'information est déjà dans le libellé de la carte pour VoiceOver.
export function WishBadge() {
  return (
    <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SymbolView name={{ ios: 'heart.fill', android: 'heart_check' }} size={iconSizes.sm} tintColor={colors.background} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: sizes.wishBadge,
    height: sizes.wishBadge,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
});
