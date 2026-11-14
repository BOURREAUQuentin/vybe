import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { getInitials } from '@/lib/format';
import { colors, fonts, fontSizes, radius, sizes } from '@/theme/tokens';

type ArtistAvatarProps = {
  name: string;
  imageUrl: string | null;
  /** md : listes ; lg : rangée « Mes artistes » ; xl : line-up de la fiche concert, artistes à l'affiche. */
  size?: 'md' | 'lg' | 'xl';
};

// Vignette ronde d'un artiste : photo, ou initiales sur fond surface.
export function ArtistAvatar({ name, imageUrl, size = 'md' }: ArtistAvatarProps) {
  const isLarge = size !== 'md';

  return (
    <View style={[styles.avatar, size === 'lg' && styles.large, size === 'xl' && styles.extraLarge]} accessible={false}>
      {imageUrl ? (
        <Image source={imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text style={[styles.initials, isLarge && styles.initialsLarge]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  large: {
    width: sizes.avatarLarge,
    height: sizes.avatarLarge,
  },
  extraLarge: {
    width: sizes.avatarXL,
    height: sizes.avatarXL,
  },
  initials: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  initialsLarge: {
    fontSize: fontSizes.lg,
  },
});
