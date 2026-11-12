import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  colors,
  fonts,
  fontSizes,
  iconSizes,
  opacity,
  spacing,
  touch,
} from '@/theme/tokens';

type VenueRowProps = {
  name: string;
  /** Ligne secondaire : adresse, ou ville. */
  subtitle?: string | null;
  onPress: () => void;
};

// Ligne de salle cliquable : icône de lieu, nom, adresse. Ouvre la fiche salle.
export function VenueRow({ name, subtitle, onPress }: VenueRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[name, subtitle].filter(Boolean).join(', ')}
      accessibilityHint="Ouvre la fiche de la salle"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <SymbolView
        name={{ ios: 'mappin.and.ellipse', android: 'location_on' }}
        size={iconSizes.md}
        tintColor={colors.textSecondary}
      />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right' }}
        size={iconSizes.md}
        tintColor={colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  text: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
