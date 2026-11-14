import { StyleSheet, View } from 'react-native';

import { colors, radius, ticket } from '@/theme/tokens';

// Ligne de perforation horizontale (pass de la fiche concert), avec une encoche de chaque côté.
// Le conteneur doit avoir `overflow: 'hidden'`.
export function HorizontalPerforation({ notchColor = colors.background }: { notchColor?: string }) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.notch, styles.notchLeft, { backgroundColor: notchColor }]} />
      <View style={styles.dots}>
        {Array.from({ length: ticket.dotsHorizontal }, (_, index) => (
          <View key={index} style={styles.dot} />
        ))}
      </View>
      <View style={[styles.notch, styles.notchRight, { backgroundColor: notchColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: ticket.notch,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  dot: {
    width: ticket.dot,
    height: ticket.dot,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  notch: {
    width: ticket.notch,
    height: ticket.notch,
    borderRadius: radius.pill,
  },
  notchLeft: {
    marginLeft: -ticket.notch / 2,
  },
  notchRight: {
    marginRight: -ticket.notch / 2,
  },
});
