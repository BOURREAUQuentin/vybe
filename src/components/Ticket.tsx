import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { StatusChip } from '@/components/StatusChip';
import { TicketLabel } from '@/components/TicketLabel';
import { VerticalPerforation } from '@/components/VerticalPerforation';
import { WishChip } from '@/components/WishChip';
import type { EventView } from '@/features/events/eventView';
import { haptics } from '@/lib/haptics';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  maxFontScale,
  radius,
  spacing,
  statusLooks,
  ticket,
} from '@/theme/tokens';

type TicketProps = {
  view: EventView;
  onPress: () => void;
  /** Concert dans les envies : pastille « ♥ Envie ». */
  isWished?: boolean;
  /** Ligne mise en avant à la place des invités (ex. « Bekar · Première partie » en recherche). */
  note?: string | null;
};

// Billet de concert (toutes les listes) : talon date | perforation | artiste, invités, lieu,
// heure et pastilles. Statut hors normale : talon coloré (complet, reporté, passé) ou billet
// assombri (annulé), voir statusLooks dans les tokens.
export function Ticket({ view, onPress, isWished = false, note }: TicketProps) {
  const look = statusLooks[view.status];
  const stub = look?.stub;

  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={[note, view.accessibilityLabel, isWished ? 'dans tes envies' : null]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Ouvre la fiche du concert"
      style={[styles.ticket, look?.ticketOpacity !== undefined && { opacity: look.ticketOpacity }]}>
      {/* Fond du talon : jusqu'à la ligne de perforation, découpé par les encoches. */}
      {stub ? (
        <View
          style={[
            styles.stubLayer,
            stub.fill ? { backgroundColor: stub.fill } : null,
            stub.outline ? [styles.stubOutline, { borderColor: stub.outline }] : null,
          ]}
        />
      ) : null}

      <View style={styles.stub}>
        <TicketLabel color={stub?.text}>{view.weekday}</TicketLabel>
        <Text style={[styles.day, stub ? { color: stub.text } : null]} maxFontSizeMultiplier={maxFontScale.display}>
          {view.day}
        </Text>
        <TicketLabel color={stub?.text}>{view.month}</TicketLabel>
      </View>

      <VerticalPerforation outline={stub?.outline} />

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {view.title}
        </Text>
        {note ? (
          <Text style={styles.note} numberOfLines={1}>
            {note}
          </Text>
        ) : view.others ? (
          <Text style={styles.meta} numberOfLines={1}>
            avec {view.others}
          </Text>
        ) : null}
        {view.place ? (
          <Text style={styles.meta} numberOfLines={1}>
            {view.place}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.time}>{view.time}</Text>
          {isWished ? <WishChip /> : null}
          <StatusChip status={view.status} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  ticket: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  stubLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: ticket.stubWidth + ticket.notch / 2,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
  // Contour : le trait droit est centré sur la perforation, que les points « trouent ».
  stubOutline: {
    width: ticket.stubWidth + ticket.notch / 2 + ticket.outlineWidth / 2,
    borderWidth: ticket.outlineWidth,
  },
  stub: {
    width: ticket.stubWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  day: {
    fontFamily: fonts.display,
    fontSize: fontSizes.stubDay,
    lineHeight: fontSizes.stubDay * lineHeights.display,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  note: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  time: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
});
