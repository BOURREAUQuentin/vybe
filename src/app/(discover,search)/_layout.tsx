import { Stack, type ErrorBoundaryProps } from 'expo-router';

import { CrashScreen } from '@/components/CrashScreen';
import { colors, fonts, fontSizes } from '@/theme/tokens';

// Si un écran de Découvrir ou Recherche plante : écran de secours, la barre d'onglets reste utilisable.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <CrashScreen onRetry={() => void retry()} />;
}

// Écran d'accueil de chaque onglet. Sans ce réglage, l'onglet Recherche ouvrait
// l'écran « index » (Découvrir) au lieu de « search ».
// La clé `search` est le nom du groupe « (search) », sans parenthèses.
export const unstable_settings = {
  anchor: 'index',
  search: { anchor: 'search' },
};

type SharedStackLayoutProps = {
  // Groupe courant fourni par Expo Router : « (discover) » ou « (search) ».
  segment: string;
};

// Pile de navigation partagée par les onglets Découvrir et Recherche :
// les écrans poussés (Infos, puis fiches concert et artiste) s'ouvrent dans l'onglet en cours.
export default function SharedStackLayout({ segment }: SharedStackLayoutProps) {
  // Le premier écran déclaré est l'écran d'accueil de l'onglet.
  const rootScreen = segment === '(search)' ? 'search' : 'index';

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.semibold, fontSize: fontSizes.md },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name={rootScreen} options={{ headerShown: false }} />
      <Stack.Screen name="infos" options={{ title: 'Infos' }} />
      {/* Fiches : pas de titre dans la barre, le titre est affiché dans la page. */}
      <Stack.Screen name="concert/[id]" options={{ title: '' }} />
      <Stack.Screen name="artist/[id]" options={{ title: '' }} />
      <Stack.Screen name="venue/[id]" options={{ title: '' }} />
      <Stack.Screen name="concerts" options={{ title: '' }} />
    </Stack>
  );
}
