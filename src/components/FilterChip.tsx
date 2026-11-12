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

type FilterChipProps = {
  /** Nom du filtre (« Date ») ou valeur choisie (« Ce week-end »). */
  label: string;
  /** Vrai si le filtre a une valeur : contour clair (pas de lime). */
  active: boolean;
  /** Nom du filtre pour les lecteurs d'écran (« Date »). */
  filterName: string;
  onPress: () => void;
};

// Pastille de la barre de filtres : ouvre le panneau de choix du filtre.
export function FilterChip({ label, active, filterName, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={active ? `Filtre ${filterName} : ${label}` : `Filtre ${filterName}`}
      accessibilityHint="Ouvre les choix du filtre"
      style={({ pressed }) => [styles.chip, active && styles.active, pressed && styles.pressed]}>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
      <SymbolView
        name={{ ios: 'chevron.down', android: 'expand_more' }}
        size={iconSizes.sm}
        tintColor={active ? colors.text : colors.textSecondary}
      />
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
  active: {
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
  labelActive: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
