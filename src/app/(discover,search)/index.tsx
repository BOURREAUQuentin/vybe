import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/theme/tokens';

// Onglet Découvrir. Les sections (« Rap à l'affiche », « Cette semaine »…) arrivent à l'étape 6.
export default function DiscoverScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Découvrir"
        action={
          <IconButton
            icon={{ ios: 'info.circle', android: 'info' }}
            accessibilityLabel="Informations"
            onPress={() => router.push('/infos')}
          />
        }
      />
      <EmptyState
        title="Bientôt des concerts ici"
        message="Les concerts à l’affiche apparaîtront sur cette page."
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
