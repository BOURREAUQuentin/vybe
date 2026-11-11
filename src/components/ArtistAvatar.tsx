import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { getInitials } from '@/lib/format';
import { colors, fonts, fontSizes, radius, sizes } from '@/theme/tokens';

type ArtistAvatarProps = {
  name: string;
  imageUrl: string | null;
};

// Vignette ronde d'un artiste : photo, ou initiales sur fond surface.
export function ArtistAvatar({ name, imageUrl }: ArtistAvatarProps) {
  return (
    <View style={styles.avatar} accessible={false}>
      {imageUrl ? (
        <Image source={imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text style={styles.initials}>{getInitials(name)}</Text>
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
  initials: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
