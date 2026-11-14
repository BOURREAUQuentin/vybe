import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, iconSizes, opacity, radius, sizes, touch } from '@/theme/tokens';

type HeartButtonProps = {
  /** Libellé lu par VoiceOver, ex. « Retirer Josman de mes envies ». */
  accessibilityLabel: string;
  onPress: () => void;
};

// Cœur plein (rond blanc) posé dans un billet de l'onglet Envies : toucher = retirer l'envie,
// comme on l'a ajoutée. Zone tactile de 44 pt même si le rond est plus petit.
export function HeartButton({ accessibilityLabel, onPress }: HeartButtonProps) {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={(touch.minSize - sizes.wishBadge) / 2 + 1}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <SymbolView name={{ ios: 'heart.fill', android: 'heart_check' }} size={iconSizes.sm} tintColor={colors.background} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.wishBadge,
    height: sizes.wishBadge,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
