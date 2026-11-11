import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/theme/tokens';

// Onglet Recherche. Le champ de recherche arrive à l'étape 7.
export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Recherche" />
      <EmptyState
        title="Recherche bientôt disponible"
        message="Tu pourras chercher un artiste, un concert ou une ville."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
