import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { DiscoverSkeleton } from '@/components/DiscoverSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { EventCard } from '@/components/EventCard';
import { FeaturedEventCard } from '@/components/FeaturedEventCard';
import { IconButton } from '@/components/IconButton';
import { MonthHeader } from '@/components/MonthHeader';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { buildDiscoverSections, type DiscoverSections } from '@/features/discover/sections';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

// Onglet Découvrir : Rap à l'affiche, Cette semaine, Par ville, Par genre, À venir (par mois).
export default function DiscoverScreen() {
  const router = useRouter();
  const { data, error, isRefetching, refetch } = useUpcomingEvents();
  const sections = useMemo(() => (data ? buildDiscoverSections(data) : null), [data]);

  const openConcert = (id: string) => router.push({ pathname: '/concert/[id]', params: { id } });

  const header = (
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
  );

  // Premier chargement : erreur ou squelette.
  if (data === undefined || sections === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        {error ? <ErrorState onRetry={() => refetch()} /> : <DiscoverSkeleton />}
      </SafeAreaView>
    );
  }

  const refreshControl = (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={() => {
        void refetch();
      }}
      tintColor={colors.text}
    />
  );

  // Aucun concert à venir : état vide (on peut quand même tirer pour rafraîchir).
  if (data.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        <ScrollView contentContainerStyle={styles.emptyScroll} refreshControl={refreshControl}>
          <EmptyState
            title="Aucun concert à venir"
            message="De nouvelles dates sont annoncées régulièrement : reviens bientôt."
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {header}
      <SectionList
        sections={sections.months}
        keyExtractor={(event) => event.id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <MonthHeader title={section.title} />}
        renderItem={({ item }) => (
          <View style={styles.cardRow}>
            <EventCard event={item} onPress={() => openConcert(item.id)} />
          </View>
        )}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.listContent}
        refreshControl={refreshControl}
        ListHeaderComponent={
          <DiscoverTopSections
            sections={sections}
            refreshFailed={Boolean(error)}
            onOpenConcert={openConcert}
            onOpenCity={(id) => router.push({ pathname: '/concerts', params: { city: id } })}
            onOpenGenre={(id) => router.push({ pathname: '/concerts', params: { genres: id } })}
            onOpenAll={() => router.push('/concerts')}
          />
        }
      />
    </SafeAreaView>
  );
}

type TopSectionsProps = {
  sections: DiscoverSections;
  refreshFailed: boolean;
  onOpenConcert: (id: string) => void;
  onOpenCity: (id: string) => void;
  onOpenGenre: (id: string) => void;
  /** Ouvre « Tous les concerts » (filtres). */
  onOpenAll: () => void;
};

// Haut de la page, au-dessus de la liste par mois. Une section vide n'est pas affichée.
function DiscoverTopSections({
  sections,
  refreshFailed,
  onOpenConcert,
  onOpenCity,
  onOpenGenre,
  onOpenAll,
}: TopSectionsProps) {
  const { featured, thisWeek, cities, genres, months } = sections;

  return (
    <View style={styles.topSections}>
      {refreshFailed ? (
        <Text style={styles.refreshError}>
          Impossible d’actualiser. Les concerts affichés peuvent ne pas être à jour.
        </Text>
      ) : null}

      {featured.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Rap à l’affiche" />
          <FlatList
            horizontal
            data={featured}
            keyExtractor={(event) => event.id}
            renderItem={({ item }) => (
              <FeaturedEventCard event={item} onPress={() => onOpenConcert(item.id)} />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}
          />
        </View>
      ) : null}

      {thisWeek.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Cette semaine" />
          <View style={styles.cards}>
            {thisWeek.map((event) => (
              <EventCard key={event.id} event={event} onPress={() => onOpenConcert(event.id)} />
            ))}
          </View>
        </View>
      ) : null}

      {cities.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Par ville" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}>
            {cities.map((city) => (
              <Chip
                key={city.id}
                label={city.name}
                count={city.count}
                onPress={() => onOpenCity(city.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {genres.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="Par genre" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}>
            {genres.map((genre) => (
              <Chip
                key={genre.id}
                label={genre.name}
                count={genre.count}
                onPress={() => onOpenGenre(genre.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {months.length > 0 ? (
        <SectionTitle
          title="À venir"
          action={{
            label: 'Tout voir',
            accessibilityLabel: 'Voir tous les concerts et les filtrer',
            onPress: onOpenAll,
          }}
        />
      ) : null}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyScroll: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  topSections: {
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  horizontalRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cards: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  cardRow: {
    paddingHorizontal: spacing.md,
  },
  separator: {
    height: spacing.xs,
  },
  refreshError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
    paddingHorizontal: spacing.md,
  },
});
