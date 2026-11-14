import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ArtistAvatar } from '@/components/ArtistAvatar';
import { haptics } from '@/lib/haptics';
import {
  colors,
  fonts,
  fontSizes,
  iconSizes,
  opacity,
  spacing,
  touch,
} from '@/theme/tokens';

type ArtistRowProps = {
  name: string;
  imageUrl: string | null;
  /** Ligne secondaire : rôle dans une programmation, ou genre dans la recherche. */
  subtitle?: string | null;
  onPress: () => void;
};

// Ligne d'artiste cliquable : vignette, nom, ligne secondaire. Ouvre la fiche artiste.
export function ArtistRow({ name, imageUrl, subtitle, onPress }: ArtistRowProps) {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={[name, subtitle].filter(Boolean).join(', ')}
      accessibilityHint="Ouvre la fiche de l’artiste"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <ArtistAvatar name={name} imageUrl={imageUrl} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right' }}
        size={iconSizes.sm}
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
    gap: spacing.xxs,
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
