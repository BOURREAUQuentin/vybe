import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { ArtistAvatar } from '@/components/ArtistAvatar';
import { haptics } from '@/lib/haptics';
import { roleLabels, type ArtistRole } from '@/lib/format';
import { colors, fonts, fontSizes, opacity, sizes, spacing, touch } from '@/theme/tokens';

type LineupEntry = {
  role: ArtistRole;
  artist: { id: string; name: string; image_url: string | null } | null;
};

type LineupAvatarsProps = {
  /** Programmation déjà triée dans l'ordre de l'affiche. */
  lineup: LineupEntry[];
  onOpenArtist: (id: string) => void;
};

// Line-up en avatars ronds (photo ou initiales), nom et rôle ; chacun ouvre la fiche artiste.
export function LineupAvatars({ lineup, onOpenArtist }: LineupAvatarsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {lineup.map(({ artist, role }) =>
        artist ? (
          <Pressable
            key={artist.id}
            onPress={() => {
              haptics.tap();
              onOpenArtist(artist.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${artist.name}, ${roleLabels[role]}`}
            accessibilityHint="Ouvre la fiche de l’artiste"
            style={({ pressed }) => [styles.artist, pressed && styles.pressed]}>
            <ArtistAvatar name={artist.name} imageUrl={artist.image_url} size="xl" />
            <Text style={styles.name} numberOfLines={1}>
              {artist.name}
            </Text>
            <Text style={styles.role} numberOfLines={1}>
              {roleLabels[role]}
            </Text>
          </Pressable>
        ) : null,
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  artist: {
    width: sizes.avatarXL + spacing.lg,
    minHeight: touch.minSize,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  role: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
});
