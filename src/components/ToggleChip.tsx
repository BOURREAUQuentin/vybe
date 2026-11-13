import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  colors,
  fonts,
  fontSizes,
  iconSizes,
  opacity,
  radius,
  spacing,
  touch,
} from '@/theme/tokens';

type ToggleChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

// Pastille à cocher (ex. genre préféré) : contour clair et coche une fois choisie. Pas de lime.
export function ToggleChip({ label, selected, onPress }: ToggleChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {selected ? (
        <SymbolView
          name={{ ios: 'checkmark', android: 'check' }}
          size={iconSizes.sm}
          tintColor={colors.text}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  selected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.text,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  labelSelected: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
