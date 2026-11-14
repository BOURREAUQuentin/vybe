import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

type OptionRowProps = {
  label: string;
  selected: boolean;
  /** Choix multiple (case à cocher) ou unique (bouton radio), pour les lecteurs d'écran. */
  multiple?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

// Ligne de choix dans un panneau de filtre : surlignée, en gras et cochée quand elle est sélectionnée.
export function OptionRow({ label, selected, multiple = false, disabled = false, onPress }: OptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected, disabled }}
      style={({ pressed }) => [styles.row, selected && styles.selected, (pressed || disabled) && styles.dimmed]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      <View style={styles.check}>
        {selected ? (
          <SymbolView
            name={{ ios: 'checkmark', android: 'check' }}
            size={iconSizes.md}
            tintColor={colors.text}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  selected: {
    backgroundColor: colors.surfaceRaised,
  },
  dimmed: {
    opacity: opacity.pressed,
  },
  label: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  labelSelected: {
    fontFamily: fonts.semibold,
  },
  check: {
    width: iconSizes.md,
    alignItems: 'center',
  },
});
