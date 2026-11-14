import { StyleSheet, View } from 'react-native';

import { colors, radius, ticket } from '@/theme/tokens';

type VerticalPerforationProps = {
  /** Couleur des encoches = fond sur lequel le billet est posé. */
  notchColor?: string;
  /** Talon à contour (Reporté) : le contour contourne aussi les encoches. */
  outline?: string;
};

// Ligne de perforation verticale entre le talon et le corps du billet, avec deux encoches
// (demi-cercles découpés en haut et en bas). Le billet doit avoir `overflow: 'hidden'`.
export function VerticalPerforation({ notchColor = colors.background, outline }: VerticalPerforationProps) {
  // Quart d'encoche cerclé, côté talon uniquement : prolonge le contour « Reporté ».
  const arc = (position: 'top' | 'bottom') =>
    outline ? (
      <View style={[styles.arcClip, position === 'top' ? styles.arcClipTop : styles.arcClipBottom]}>
        <View
          style={[
            styles.notch,
            styles.arcCircle,
            position === 'top' ? styles.arcCircleTop : null,
            { borderColor: outline, backgroundColor: notchColor },
          ]}
        />
      </View>
    ) : null;

  return (
    <View style={styles.column} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.notch, styles.notchTop, { backgroundColor: notchColor }]} />
      <View style={styles.dots}>
        {Array.from({ length: ticket.dots }, (_, index) => (
          <View key={index} style={styles.dot} />
        ))}
      </View>
      <View style={[styles.notch, styles.notchBottom, { backgroundColor: notchColor }]} />
      {arc('top')}
      {arc('bottom')}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: ticket.notch,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flex: 1,
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
  notchTop: {
    marginTop: -ticket.notch / 2,
  },
  notchBottom: {
    marginBottom: -ticket.notch / 2,
  },
  arcClip: {
    position: 'absolute',
    left: 0,
    width: ticket.notch / 2,
    height: ticket.notch / 2,
    overflow: 'hidden',
  },
  arcClipTop: {
    top: 0,
  },
  arcClipBottom: {
    bottom: 0,
  },
  arcCircle: {
    borderWidth: ticket.outlineWidth,
  },
  arcCircleTop: {
    marginTop: -ticket.notch / 2,
  },
});
