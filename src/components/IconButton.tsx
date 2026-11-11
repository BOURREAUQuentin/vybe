import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { colors, iconSizes, opacity, touch } from '@/theme/tokens';

type IconButtonProps = {
  /** Icône : symbole SF sur iOS, Material Symbol sur Android. */
  icon: SymbolViewProps['name'];
  /** Libellé lu par VoiceOver / TalkBack (obligatoire pour un bouton sans texte). */
  accessibilityLabel: string;
  onPress: () => void;
};

// Bouton-icône avec une zone tactile d'au moins 44 × 44 points.
export function IconButton({ icon, accessibilityLabel, onPress }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={touch.minSize / 4}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <SymbolView name={icon} size={iconSizes.md} tintColor={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: touch.minSize,
    minHeight: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
