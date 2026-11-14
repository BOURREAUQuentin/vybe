import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArtistChip } from '@/components/ArtistChip';
import { ErrorState } from '@/components/ErrorState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SearchField } from '@/components/SearchField';
import { useAuth } from '@/features/auth/AuthContext';
import { markOnboardingSeen } from '@/features/follows/onboarding';
import {
  useFollowedArtists,
  useFollowMany,
  useOnboardingArtists,
  useOnboardingSearch,
} from '@/features/follows/useFollows';
import { MIN_QUERY_LENGTH } from '@/features/search/api';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  maxFontScale,
  opacity,
  spacing,
  touch,
} from '@/theme/tokens';

const SEARCH_DEBOUNCE_MS = 300;
/** Position de la barre de recherche parmi les enfants du ScrollView (titre, intro, recherche…). */
const STICKY_SEARCH_INDEX = 2;

// Onboarding « Suis quelques artistes » (V1.3), présenté en modale :
// après la première connexion, ou à la demande depuis « Mes artistes ».
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const [text, setText] = useState('');
  const query = useDebouncedValue(text, SEARCH_DEBOUNCE_MS).trim();
  const isSearching = query.length >= MIN_QUERY_LENGTH;
  // Sans recherche : sélection d'artistes rap ; avec recherche : tout le catalogue (côté base).
  const suggestions = useOnboardingArtists();
  const search = useOnboardingSearch(query);
  const { data: artists, error, refetch } = isSearching ? search : suggestions;
  const { data: followed } = useFollowedArtists();
  const followMany = useFollowMany();
  // Les coches sont conservées quand on change de recherche.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const alreadyFollowed = new Set(followed?.map((row) => row.artist_id) ?? []);

  const close = () => {
    if (userId) markOnboardingSeen(userId);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const toggle = (artistId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(artistId)) next.delete(artistId);
      else next.add(artistId);
      return next;
    });

  const confirm = () => {
    followMany.mutate([...selected], { onSuccess: close });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Passer"
              style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
              <Text style={styles.skipLabel}>Passer</Text>
            </Pressable>
          ),
        }}
      />
      {/* La recherche (3e élément, index 2) reste collée en haut quand on fait défiler :
          le titre et l'introduction défilent, la barre de recherche reste accessible. */}
      <ScrollView
        contentContainerStyle={styles.content}
        stickyHeaderIndices={[STICKY_SEARCH_INDEX]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <Text
          style={styles.title}
          accessibilityRole="header"
          maxFontSizeMultiplier={maxFontScale.display}>
          Suis quelques artistes
        </Text>
        <Text style={styles.intro}>
          Choisis les artistes que tu aimes : tu retrouveras leurs prochains concerts dans
          l’onglet Artistes. Tu pourras en ajouter d’autres depuis chaque fiche.
        </Text>

        <View style={styles.stickySearch}>
          <SearchField value={text} onChangeText={setText} placeholder="Rechercher un artiste" />
        </View>
        <Text style={styles.listLabel}>
          {isSearching ? `Résultats pour « ${query} »` : 'Suggestions rap'}
        </Text>

        {artists === undefined ? (
          error ? (
            <ErrorState
              title="Impossible de charger les artistes"
              onRetry={() => refetch()}
            />
          ) : (
            <Text style={styles.intro}>
              {isSearching ? 'Recherche…' : 'Chargement des artistes…'}
            </Text>
          )
        ) : artists.length === 0 ? (
          <Text style={styles.intro}>
            Aucun artiste trouvé pour « {query} ». Vérifie l’orthographe.
          </Text>
        ) : (
          <View style={styles.chips}>
            {artists.map((artist) => {
              const locked = alreadyFollowed.has(artist.id);
              return (
                <ArtistChip
                  key={artist.id}
                  name={artist.name}
                  imageUrl={artist.image_url}
                  selected={locked || selected.has(artist.id)}
                  locked={locked}
                  onPress={() => toggle(artist.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Action principale fixe en bas de l'écran. */}
      <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
        {followMany.isError ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            Impossible d’enregistrer tes choix. Vérifie ta connexion et réessaie.
          </Text>
        ) : null}
        <PrimaryButton
          label={selected.size > 0 ? `Continuer (${selected.size})` : 'Continuer'}
          accessibilityHint="Suit les artistes sélectionnés"
          disabled={selected.size === 0}
          loading={followMany.isPending}
          onPress={confirm}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.screenTitle,
    color: colors.text,
  },
  intro: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.textSecondary,
  },
  // Fond opaque : les artistes qui défilent passent dessous sans se voir au travers.
  stickySearch: {
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
  },
  listLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
    columnGap: spacing.xs,
  },
  footer: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairlineStrong,
    backgroundColor: colors.background,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
  },
  skip: {
    minHeight: touch.minSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  skipLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
});
