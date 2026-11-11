import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import type { EventListItem } from '@/features/events/api';
import { getLineupLabels } from '@/features/events/lineup';
import { formatEventDate, getDateBlock } from '@/lib/dates';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  opacity,
  radius,
  spacing,
  statusBadges,
} from '@/theme/tokens';

type EventCardProps = {
  event: EventListItem;
  /** Ouvre la fiche concert. */
  onPress: () => void;
};

// Carte de concert (liste) : bloc date, affiche, salle et ville, badge de statut.
export function EventCard({ event, onPress }: EventCardProps) {
  const { day, month } = getDateBlock(event.starts_at);
  const { title, others } = getLineupLabels(event.name, event.lineup);
  const place = [event.venue?.name, event.venue?.city?.name].filter(Boolean).join(' · ');
  const isCancelled = event.status === 'cancelled';

  const accessibilityLabel = [
    title,
    others ? `avec ${others}` : null,
    formatEventDate(event.starts_at, event.time_tba),
    place || null,
    statusBadges[event.status].label,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Ouvre la fiche du concert"
      style={({ pressed }) => [
        styles.card,
        isCancelled && styles.cancelled,
        pressed && styles.pressed,
      ]}>
      <View style={styles.dateBlock}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.month}>{month}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {others ? (
          <Text style={styles.secondary} numberOfLines={1}>
            avec {others}
          </Text>
        ) : null}
        <Text style={styles.secondary} numberOfLines={1}>
          {formatEventDate(event.starts_at, event.time_tba)}
        </Text>
        {place ? (
          <Text style={styles.secondary} numberOfLines={1}>
            {place}
          </Text>
        ) : null}
      </View>

      <StatusBadge status={event.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  cancelled: {
    opacity: opacity.disabled,
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
  },
  dateBlock: {
    minWidth: spacing.xxl,
    alignItems: 'center',
  },
  day: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.display,
    color: colors.text,
  },
  month: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.accent,
  },
  info: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  secondary: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
