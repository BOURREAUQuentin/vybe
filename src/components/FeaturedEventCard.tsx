import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getMainArtist } from '@/features/discover/sections';
import type { EventListItem } from '@/features/events/api';
import { getLineupLabels } from '@/features/events/lineup';
import { formatEventDate } from '@/lib/dates';
import { getInitials } from '@/lib/format';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  opacity,
  radius,
  sizes,
  spacing,
  statusBadges,
} from '@/theme/tokens';

type FeaturedEventCardProps = {
  event: EventListItem;
  onPress: () => void;
};

const PHOTO_GRADIENT = `linear-gradient(to top, ${colors.overlay} 0%, transparent 70%)`;

// Carte vedette (format affiche) : photo de l'artiste + dégradé + nom en Anton,
// ou, sans photo, fond surface avec les initiales en Anton lime (docs/design.md).
export function FeaturedEventCard({ event, onPress }: FeaturedEventCardProps) {
  const { title } = getLineupLabels(event.name, event.lineup);
  const imageUrl = getMainArtist(event)?.image_url ?? null;
  const date = formatEventDate(event.starts_at, event.time_tba);
  const city = event.venue?.city.name;
  const status = event.status === 'sold_out' ? statusBadges.sold_out.label : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, date, city, status].filter(Boolean).join(', ')}
      accessibilityHint="Ouvre la fiche du concert"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {imageUrl ? (
        <>
          <Image source={imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          <View style={[StyleSheet.absoluteFill, styles.gradient]} />
        </>
      ) : (
        <View style={styles.initialsContainer}>
          <Text style={styles.initials}>{getInitials(title)}</Text>
        </View>
      )}

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {date}
        </Text>
        {city || status ? (
          <Text style={styles.meta} numberOfLines={1}>
            {[city, status].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: sizes.featuredWidth,
    height: sizes.featuredHeight,
    justifyContent: 'flex-end',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  gradient: {
    experimental_backgroundImage: PHOTO_GRADIENT,
  },
  initialsContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  initials: {
    fontFamily: fonts.display,
    fontSize: fontSizes.initials,
    lineHeight: fontSizes.initials * lineHeights.display,
    color: colors.accent,
  },
  text: {
    gap: spacing.xxs,
    padding: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * lineHeights.display,
    color: colors.text,
    textTransform: 'uppercase',
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
});
