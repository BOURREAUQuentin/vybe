import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ErrorState';
import { colors } from '@/theme/tokens';

type CrashScreenProps = {
  onRetry: () => void;
};

// Écran de secours affiché par les ErrorBoundary d'Expo Router quand un écran plante,
// au lieu de fermer l'application.
export function CrashScreen({ onRetry }: CrashScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ErrorState
        title="Oups, quelque chose s’est mal passé"
        message="Réessaie. Si le problème continue, ferme puis rouvre l’application."
        onRetry={onRetry}
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
