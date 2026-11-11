import { StyleSheet, Text } from 'react-native';

import { sourceLabels, type DataSource } from '@/lib/format';
import { colors, fonts, fontSizes } from '@/theme/tokens';

type SourceNoteProps = {
  source: DataSource;
};

// Mention de la source des données (obligatoire sur la fiche concert).
export function SourceNote({ source }: SourceNoteProps) {
  return <Text style={styles.note}>{sourceLabels[source]}</Text>;
}

const styles = StyleSheet.create({
  note: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
});
