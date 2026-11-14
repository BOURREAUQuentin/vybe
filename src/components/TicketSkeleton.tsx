import { StyleSheet, View } from 'react-native';

import { VerticalPerforation } from '@/components/VerticalPerforation';
import { colors, fontSizes, radius, spacing, ticket } from '@/theme/tokens';

// Silhouette d'un billet pendant le chargement (même forme que Ticket).
export function TicketSkeleton() {
  return (
    <View style={styles.ticket} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={styles.stub}>
        <View style={[styles.line, styles.stubLine]} />
        <View style={styles.day} />
        <View style={[styles.line, styles.stubLine]} />
      </View>
      <VerticalPerforation />
      <View style={styles.body}>
        <View style={[styles.line, styles.lineTitle]} />
        <View style={[styles.line, styles.lineMedium]} />
        <View style={[styles.line, styles.lineShort]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  stub: {
    width: ticket.stubWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  stubLine: {
    width: spacing.lg,
    height: fontSizes.label,
  },
  day: {
    width: spacing.xl,
    height: fontSizes.stubDay,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
  },
  line: {
    height: fontSizes.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
  lineTitle: {
    width: '55%',
    height: fontSizes.md,
  },
  lineMedium: {
    width: '70%',
  },
  lineShort: {
    width: '35%',
  },
});
