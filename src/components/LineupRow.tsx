import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ArtistAvatar } from '@/components/ArtistAvatar';
import { roleLabels, type ArtistRole } from '@/lib/format';
import {
  colors,
  fonts,
  fontSizes,
  iconSizes,
  opacity,
  spacing,
  touch,
} from '@/theme/tokens';

type LineupRowProps = {
  name: string;
  imageUrl: string | null;
  role: ArtistRole;
  onPress: () => void;
};

// Ligne de programmation : vignette, nom, rôle. Ouvre la fiche artiste.
export function LineupRow({ name, imageUrl, role, onPress }: LineupRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${roleLabels[role]}`}
      accessibilityHint="Ouvre la fiche de l’artiste"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <ArtistAvatar name={name} imageUrl={imageUrl} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.role}>{roleLabels[role]}</Text>
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
  role: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
