import { Stack, type ErrorBoundaryProps } from 'expo-router';

import { CrashScreen } from '@/components/CrashScreen';
import { colors, fonts, fontSizes } from '@/theme/tokens';

// Si un écran d'un onglet plante : écran de secours, la barre d'onglets reste utilisable.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <CrashScreen onRetry={() => void retry()} />;
}

// Écran d'accueil de chaque onglet (groupe). Sans ce réglage, Expo Router ouvrirait
// l'écran « index » (Découvrir) dans tous les onglets. Les clés sont les noms des groupes
// sans parenthèses : « (search) » → search, etc.
const ROOT_SCREENS = {
  discover: 'index',
  search: 'search',
  artists: 'my-artists',
  wishlist: 'wishlist',
  profile: 'profile',
} as const;

export const unstable_settings = {
  anchor: ROOT_SCREENS.discover,
  search: { anchor: ROOT_SCREENS.search },
  artists: { anchor: ROOT_SCREENS.artists },
  wishlist: { anchor: ROOT_SCREENS.wishlist },
  profile: { anchor: ROOT_SCREENS.profile },
};

type SharedStackLayoutProps = {
  // Groupe courant fourni par Expo Router : « (discover) », « (search) », « (artists) »…
  segment: string;
};

function rootScreenFor(segment: string): string {
  const group = segment.replace(/[()]/g, '');
  return group in ROOT_SCREENS ? ROOT_SCREENS[group as keyof typeof ROOT_SCREENS] : 'index';
}

// Pile de navigation partagée par les 5 onglets : les écrans poussés (fiches, « Concerts »,
// Infos, connexion) s'ouvrent dans l'onglet en cours, avec la barre d'onglets visible.
export default function SharedStackLayout({ segment }: SharedStackLayoutProps) {
  // Le premier écran déclaré est l'écran d'accueil de l'onglet.
  const rootScreen = rootScreenFor(segment);

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
      {/* Préférences du Profil (V1.3). */}
      <Stack.Screen name="favorite-cities" options={{ title: 'Mes villes' }} />
      <Stack.Screen name="favorite-venues" options={{ title: 'Mes salles' }} />
      {/* Connexion (V1.3) : fenêtre modale par-dessus l'onglet en cours. */}
      <Stack.Screen name="sign-in" options={{ title: '', presentation: 'modal' }} />
      {/* Onboarding « Suis quelques artistes » (V1.3) : modale aussi. */}
      <Stack.Screen name="onboarding" options={{ title: '', presentation: 'modal' }} />
    </Stack>
  );
}
