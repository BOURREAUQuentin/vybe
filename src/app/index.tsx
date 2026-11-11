import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, fontSizes, lineHeights, spacing } from '@/theme/tokens';

// Écran témoin de l'étape 1 : vérifie que les polices et le thème sont bien branchés.
// Il sera remplacé par les onglets Découvrir / Recherche à l'étape 2.
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Vybe</Text>
        <Text style={styles.subtitle}>Les concerts rap, près de chez toi.</Text>
        <Text style={styles.accent}>Bientôt disponible</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.hero,
    lineHeight: fontSizes.hero * lineHeights.tight,
    color: colors.text,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.textSecondary,
  },
  accent: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.accent,
  },
});
