import { StyleSheet, Text, View } from 'react-native';

import {
  fonts,
  fontSizes,
  radius,
  spacing,
  statusBadges,
  type EventStatus,
} from '@/theme/tokens';

type StatusBadgeProps = {
  status: EventStatus;
};

// Badge de statut d'un concert. Seul « Billetterie ouverte » est en lime (voir tokens).
export function StatusBadge({ status }: StatusBadgeProps) {
  const badge = statusBadges[status];

  return (
    <View
      style={[styles.badge, { backgroundColor: badge.background, borderColor: badge.border }]}>
      <Text style={[styles.label, { color: badge.text }]} numberOfLines={1}>
        {badge.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
  },
});
