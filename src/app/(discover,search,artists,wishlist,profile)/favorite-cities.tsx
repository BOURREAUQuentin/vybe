import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DetailSection } from '@/components/DetailSection';
import { DetailSkeleton } from '@/components/DetailSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { OptionRow } from '@/components/OptionRow';
import { SearchField } from '@/components/SearchField';
import { SignInPrompt } from '@/components/SignInPrompt';
import { ToggleChip } from '@/components/ToggleChip';
import { useAuth } from '@/features/auth/AuthContext';
import { RADIUS_OPTIONS } from '@/features/filters/filters';
import { useFilterOptions } from '@/features/filters/useFilteredEvents';
import { NEARBY_RADIUS_KM } from '@/features/nearby/NearbyContext';
import {
  useFavoriteCities,
  useUpdateFavoriteCities,
} from '@/features/preferences/usePreferences';
import { matchesQuery } from '@/lib/text';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/theme/tokens';

// « Mes villes » (V1.3) : ville principale (+ rayon) qui alimente « Près de chez toi »,
// et autres villes favorites.
export default function FavoriteCitiesScreen() {
  const { userId } = useAuth();
  // Le bas du contenu ne doit pas rester caché sous la barre d'onglets (iOS).
  const bottomSpace = useTabBarSpace();
  const options = useFilterOptions();
  const favorites = useFavoriteCities();
  const update = useUpdateFavoriteCities();
  const [mainQuery, setMainQuery] = useState('');
  const [otherQuery, setOtherQuery] = useState('');

  if (!userId) {
    return (
      <View style={styles.container}>
        <SignInPrompt
          icon={{ ios: 'building.2', android: 'location_city' }}
          title="Tes villes"
          message="Connecte-toi pour garder tes villes favorites et ta ville principale."
        />
      </View>
    );
  }

  if (options.data === undefined || favorites.data === undefined) {
    const error = options.error ?? favorites.error;
    return (
      <View style={styles.container}>
        {error ? (
          <ErrorState
            title="Impossible de charger tes villes"
            onRetry={() => {
              void options.refetch();
              void favorites.refetch();
            }}
          />
        ) : (
          <DetailSkeleton />
        )}
      </View>
    );
  }

  const main = favorites.data.find((row) => row.is_main) ?? null;
  const favoriteIds = new Set(favorites.data.map((row) => row.city_id));
  const radiusKm = main?.radius_km ?? NEARBY_RADIUS_KM;
  // Chaque section a sa recherche (plus de 400 villes : trop long à faire défiler). Sans
  // recherche, une section ne montre que tes choix actuels.
  const isSearchingMain = mainQuery.trim().length > 0;
  const isSearchingOther = otherQuery.trim().length > 0;
  const mainCities = isSearchingMain
    ? options.data.cities.filter((city) => matchesQuery(city.name, mainQuery))
    : options.data.cities.filter((city) => city.id === main?.city_id);
  const otherCities = (
    isSearchingOther
      ? options.data.cities.filter((city) => matchesQuery(city.name, otherQuery))
      : options.data.cities.filter((city) => favoriteIds.has(city.id))
  ).filter((city) => city.id !== main?.city_id);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled">
      <DetailSection title="Ville principale">
        <Text style={styles.help}>
          Elle remplit automatiquement « Près de chez toi » sur Découvrir.
        </Text>
        <SearchField value={mainQuery} onChangeText={setMainQuery} placeholder="Choisir une ville principale" />
        {isSearchingMain && mainCities.length === 0 ? (
          <Text style={styles.help}>Aucune ville ne correspond à « {mainQuery.trim()} ».</Text>
        ) : null}
        <OptionRow
          label="Aucune"
          selected={main === null}
          onPress={() => update.mutate({ type: 'unsetMain' })}
        />
        {mainCities.map((city) => (
          <OptionRow
            key={city.id}
            label={city.name}
            selected={main?.city_id === city.id}
            onPress={() => {
              update.mutate({ type: 'setMain', cityId: city.id, radiusKm });
              setMainQuery(''); // une seule ville principale : la liste se referme sur ton choix
            }}
          />
        ))}
      </DetailSection>

      {main ? (
        <DetailSection title={`Rayon autour de ${main.city.name}`}>
          <View style={styles.chips}>
            {RADIUS_OPTIONS.map((radius) => (
              <ToggleChip
                key={radius}
                label={`${radius} km`}
                selected={radiusKm === radius}
                onPress={() =>
                  update.mutate({ type: 'setMain', cityId: main.city_id, radiusKm: radius })
                }
              />
            ))}
          </View>
        </DetailSection>
      ) : null}

      <DetailSection title="Autres villes favorites">
        <SearchField value={otherQuery} onChangeText={setOtherQuery} placeholder="Ajouter une ville" />
        {otherCities.length === 0 ? (
          <Text style={styles.help}>
            {isSearchingOther
              ? `Aucune ville ne correspond à « ${otherQuery.trim()} ».`
              : 'Aucune pour l’instant. Cherche une ville pour l’ajouter.'}
          </Text>
        ) : null}
        {otherCities.map((city) => {
            const selected = favoriteIds.has(city.id);
            return (
              <OptionRow
                key={city.id}
                label={city.name}
                multiple
                selected={selected}
                onPress={() =>
                  update.mutate(
                    selected
                      ? { type: 'remove', cityId: city.id }
                      : { type: 'add', cityId: city.id },
                  )
                }
              />
            );
          })}
      </DetailSection>

      {update.isError ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          Impossible d’enregistrer ton choix. Vérifie ta connexion et réessaie.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  help: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
  },
});
