import { StyleSheet, Text, View } from 'react-native';

import { fonts, fontSizes, radius, spacing, statusLooks, type EventStatus } from '@/theme/tokens';

// Pastille de statut droite et compacte : uniquement pour un statut hors normale
// (complet, reporté, annulé, passé). Rien pour un concert annoncé ou en vente.
// Fond opaque : lisible aussi posée sur une photo.
export function StatusChip({ status }: { status: EventStatus }) {
  const look = statusLooks[status];
  if (!look) return null;
  const { fill, border, text, strike } = look.chipStyle;

  return (
    <View style={[styles.chip, { backgroundColor: fill, borderColor: border }]}>
      <Text style={[styles.text, { color: text }, strike && styles.struck]} numberOfLines={1}>
        {look.chip}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs / 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.chip,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
});
