import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Barcode } from '@/components/Barcode';
import { HorizontalPerforation } from '@/components/HorizontalPerforation';
import { TicketLabel } from '@/components/TicketLabel';
import { haptics } from '@/lib/haptics';
import { colors, fonts, fontSizes, iconSizes, opacity, radius, spacing, touch } from '@/theme/tokens';

type PassCell = { label: string; value: string };

type EventPassProps = {
  /** Identifiant du concert (code-barres et numéro décoratifs). */
  eventId: string;
  venue: { name: string; address: string | null } | null;
  /** Cases de la grille (date, heure, ville, prix…) ; une case sans valeur n'est pas affichée. */
  cells: PassCell[];
  onOpenVenue: () => void;
};

// Le « pass » de la fiche concert : salle sur toute la largeur (ouvre la fiche salle),
// grille d'infos encadrée, perforation, code-barres décoratif.
export function EventPass({ eventId, venue, cells, onOpenVenue }: EventPassProps) {
  return (
    <View style={styles.pass}>
      {venue ? (
        <Pressable
          onPress={() => {
            haptics.tap();
            onOpenVenue();
          }}
          accessibilityRole="button"
          accessibilityLabel={['Salle', venue.name, venue.address].filter(Boolean).join(', ')}
          accessibilityHint="Ouvre la fiche de la salle"
          style={({ pressed }) => [styles.venue, pressed && styles.pressed]}>
          <View style={styles.venueIcon}>
            <SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on' }} size={iconSizes.md} tintColor={colors.text} />
          </View>
          <View style={styles.venueText}>
            <TicketLabel>Salle</TicketLabel>
            <Text style={styles.value} numberOfLines={1}>
              {venue.name}
            </Text>
            {venue.address ? (
              <Text style={styles.address} numberOfLines={2}>
                {venue.address}
              </Text>
            ) : null}
          </View>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right' }} size={iconSizes.sm} tintColor={colors.textSecondary} />
        </Pressable>
      ) : null}

      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.label} style={styles.cell} accessible accessibilityLabel={`${cell.label} : ${cell.value}`}>
            <TicketLabel>{cell.label}</TicketLabel>
            <Text style={styles.value} numberOfLines={2}>
              {cell.value}
            </Text>
          </View>
        ))}
      </View>

      <HorizontalPerforation />
      <View style={styles.footer}>
        <Barcode id={eventId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pass: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  venue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.minSize,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  venueIcon: {
    width: touch.minSize,
    height: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  venueText: {
    flex: 1,
    gap: spacing.xxs,
  },
  address: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    gap: spacing.xxs,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
});
