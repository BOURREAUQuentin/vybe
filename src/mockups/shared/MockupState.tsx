import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/ErrorState';
import { colors } from '@/theme/tokens';

type MockupStateProps = {
  error: Error | null;
  onRetry: () => void;
};

// Chargement ou erreur d'un écran de maquette (les vrais squelettes viendront à l'étape 3).
export function MockupState({ error, onRetry }: MockupStateProps) {
  return (
    <View style={styles.container}>
      {error ? <ErrorState onRetry={onRetry} /> : <ActivityIndicator color={colors.text} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
