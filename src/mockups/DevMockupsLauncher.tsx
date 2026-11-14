import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

// TEMPORAIRE (refonte, étape 2) : ouvre les maquettes au démarrage, en développement seulement,
// si le serveur est lancé avec EXPO_PUBLIC_DEV_MOCKUPS=1. Sans cette variable : aucun effet.
// Supprimé à l'étape 3 avec le dossier src/mockups.
const ENABLED = __DEV__ && process.env.EXPO_PUBLIC_DEV_MOCKUPS === '1';

export function DevMockupsLauncher() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const hasOpened = useRef(false);
  const isReady = Boolean(navigationState?.key);

  useEffect(() => {
    if (!ENABLED || !isReady || hasOpened.current) return;
    hasOpened.current = true;
    router.push('/dev-mockups');
  }, [isReady, router]);

  return null;
}
