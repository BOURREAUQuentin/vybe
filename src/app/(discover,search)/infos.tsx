import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/theme/tokens';

// Page Infos, ouverte depuis Découvrir. Les textes (à propos, mentions légales,
// confidentialité) arrivent à l'étape 8.
export default function InfosScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="Infos bientôt disponibles"
        message="À propos, mentions légales et politique de confidentialité."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
