import { StyleSheet, Text, View } from 'react-native';

import { barcodeFromId } from '@/features/events/eventView';
import { colors, fonts, fontSizes, letterSpacing, spacing, ticket } from '@/theme/tokens';

// Faux code-barres et numéro de billet, purement décoratifs (masqués aux lecteurs d'écran).
export function Barcode({ id }: { id: string }) {
  const widths = barcodeFromId(id, ticket.barcodeBars);

  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.bars}>
        {widths.map((width, index) => (
          <View
            key={index}
            style={{
              width: width * ticket.barcodeUnit,
              height: ticket.barcodeHeight,
              marginRight: ticket.barcodeUnit * ((index % 3) + 1),
              // Une barre sur cinq est un blanc : rythme irrégulier d'un vrai code-barres.
              backgroundColor: index % 5 === 4 ? colors.transparent : colors.textSecondary,
            }}
          />
        ))}
      </View>
      <Text style={styles.number}>N° {id.slice(0, 8).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  number: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.label,
    letterSpacing: letterSpacing.label,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
  },
});
