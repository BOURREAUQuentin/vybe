import { StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSizes, letterSpacing } from '@/theme/tokens';

type TicketLabelProps = {
  children: string;
  /** Couleur (par défaut : texte secondaire), ex. noir sur un talon corail. */
  color?: string;
};

// Petite étiquette en capitales espacées, façon champ de billet (« SALLE », « SAM », « NOV »).
export function TicketLabel({ children, color = colors.textSecondary }: TicketLabelProps) {
  return <Text style={[styles.label, { color }]}>{children.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.label,
    letterSpacing: letterSpacing.label,
  },
});
