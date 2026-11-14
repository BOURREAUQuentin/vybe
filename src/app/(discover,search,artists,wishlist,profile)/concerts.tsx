import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterChip } from '@/components/FilterChip';
import { FilterSheet } from '@/components/FilterSheet';
import { MonthHeader } from '@/components/MonthHeader';
import { OptionRow } from '@/components/OptionRow';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Ticket } from '@/components/Ticket';
import { TicketSkeleton } from '@/components/TicketSkeleton';
import { groupEventsByMonth } from '@/features/discover/sections';
import { describeEvent } from '@/features/events/eventView';
import {
  countActiveFilters,
  EMPTY_FILTERS,
  parseFilterParams,
  RADIUS_OPTIONS,
  type EventFilters,
  type FilterParams,
} from '@/features/filters/filters';
import { useFilteredEvents, useFilterOptions } from '@/features/filters/useFilteredEvents';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { datePresetLabels, type DatePreset } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  opacity,
  radius,
  spacing,
  touch,
} from '@/theme/tokens';

type SheetName = 'date' | 'city' | 'genre' | 'radius';

const DATE_PRESETS = Object.keys(datePresetLabels) as DatePreset[];
const SKELETON_COUNT = 5;

// Écran « Concerts » (V1.2, restylé V1.3.1) : filtres combinables date, ville, genre, rayon,
// fixes en haut ; concerts en billets, par mois.
// Les filtres de départ viennent de l'adresse (ex. ouvert depuis « Par ville » sur Découvrir).
export default function ConcertsScreen() {
  const router = useRouter();
  // Le bas du contenu ne doit pas rester caché sous la barre d'onglets (iOS).
  const bottomSpace = useTabBarSpace();
  const params = useLocalSearchParams<FilterParams>();
  const [filters, setFilters] = useState<EventFilters>(() => parseFilterParams(params));
  const [openSheet, setOpenSheet] = useState<SheetName | null>(null);

  const { data, error, isRefetching, isPlaceholderData, refetch } = useFilteredEvents(filters);
  const { data: options } = useFilterOptions();
  const sections = useMemo(() => (data ? groupEventsByMonth(data) : []), [data]);

  const { data: wishIds } = useWishlistIds();

  // Chaque choix de filtre donne un petit retour haptique.
  const update = (changes: Partial<EventFilters>) => {
    haptics.select();
    setFilters((current) => ({ ...current, ...changes }));
  };
  const close = () => setOpenSheet(null);

  // Libellés des pastilles.
  const cityName = options?.cities.find((city) => city.id === filters.cityId)?.name;
  const genreNames = filters.genreIds
    .map((id) => options?.genres.find((genre) => genre.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const genreLabel =
    genreNames.length === 0
      ? 'Genre'
      : genreNames.length === 1
        ? genreNames[0]
        : `${genreNames[0]} +${genreNames.length - 1}`;
  const activeCount = countActiveFilters(filters);

  const header = (
    <View style={styles.header}>
      {/* Pastilles sur une ou plusieurs lignes : toutes visibles sans faire défiler. */}
      <View style={styles.filterBar}>
        <FilterChip
          filterName="date"
          label={filters.date === 'all' ? 'Date' : datePresetLabels[filters.date]}
          active={filters.date !== 'all'}
          onPress={() => setOpenSheet('date')}
        />
        <FilterChip
          filterName="ville"
          label={filters.position ? 'Autour de moi' : (cityName ?? 'Ville')}
          active={filters.cityId !== null || filters.position !== null}
          onPress={() => setOpenSheet('city')}
        />
        <FilterChip
          filterName="rayon"
          label={filters.radiusKm !== null ? `${filters.radiusKm} km` : 'Rayon'}
          active={filters.radiusKm !== null}
          onPress={() => setOpenSheet('radius')}
        />
        <FilterChip
          filterName="genre"
          label={genreLabel}
          active={filters.genreIds.length > 0}
          onPress={() => setOpenSheet('genre')}
        />
      </View>

      {/* Ligne de résumé : nombre de résultats à gauche, réinitialisation à droite. */}
      {(data !== undefined && data.length > 0) || activeCount > 0 ? (
        <View style={styles.summary}>
          <Text style={styles.count}>
            {data !== undefined && data.length > 0
              ? `${data.length} concert${data.length > 1 ? 's' : ''}`
              : ''}
          </Text>
          {activeCount > 0 ? (
            <Pressable
              onPress={() => {
                haptics.select();
                setFilters(EMPTY_FILTERS);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Réinitialiser les filtres (${activeCount} actif${activeCount > 1 ? 's' : ''})`}
              hitSlop={spacing.sm}
              style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
              <Text style={styles.resetLabel}>Réinitialiser ({activeCount})</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {error && data !== undefined ? (
        <Text style={styles.refreshError}>
          Impossible d’actualiser. Les concerts affichés peuvent ne pas être à jour.
        </Text>
      ) : null}
    </View>
  );

  let emptyContent;
  if (data === undefined) {
    emptyContent = error ? (
      <ErrorState onRetry={() => refetch()} />
    ) : (
      <View style={styles.skeletons} accessibilityLabel="Chargement des concerts">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <TicketSkeleton key={index} />
        ))}
      </View>
    );
  } else {
    emptyContent = (
      <EmptyState
        title={activeCount > 0 ? 'Aucun concert ne correspond à ces filtres' : 'Aucun concert à venir'}
        message={
          activeCount > 0
            ? 'Essaie une autre période, une autre ville ou un rayon plus large.'
            : 'De nouvelles dates sont annoncées régulièrement : reviens bientôt.'
        }
        action={
          activeCount > 0
            ? { label: 'Réinitialiser', onPress: () => setFilters(EMPTY_FILTERS) }
            : undefined
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtres et résumé fixes en haut : toujours visibles pendant que les billets défilent. */}
      {header}
      <SectionList
        style={isPlaceholderData && styles.stale}
        sections={sections}
        keyExtractor={(event) => event.id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <MonthHeader title={section.title} />}
        renderItem={({ item }) => (
          <View style={styles.cardRow}>
            <Ticket
              view={describeEvent(item)}
              isWished={wishIds?.includes(item.id) ?? false}
              onPress={() => router.push({ pathname: '/concert/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={<View style={styles.empty}>{emptyContent}</View>}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomSpace },
          sections.length === 0 && styles.grow,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.text}
          />
        }
      />

      {/* Panneaux de choix des filtres */}
      <FilterSheet title="Date" isPresented={openSheet === 'date'} onDismiss={close}>
        {DATE_PRESETS.map((preset) => (
          <OptionRow
            key={preset}
            label={datePresetLabels[preset]}
            selected={filters.date === preset}
            onPress={() => {
              update({ date: preset });
              close();
            }}
          />
        ))}
      </FilterSheet>

      <FilterSheet title="Ville" isPresented={openSheet === 'city'} onDismiss={close} scrollable>
        <OptionRow
          label="Toutes les villes"
          selected={filters.cityId === null && filters.position === null}
          onPress={() => {
            update({ cityId: null, position: null, radiusKm: null });
            close();
          }}
        />
        {/* Position venue de « Près de chez toi » : affichée tant qu'aucune ville ne la remplace. */}
        {filters.position ? (
          <OptionRow label="Autour de moi" selected onPress={close} />
        ) : null}
        {(options?.cities ?? []).map((city) => (
          <OptionRow
            key={city.id}
            label={city.name}
            selected={filters.cityId === city.id}
            onPress={() => {
              update({ cityId: city.id, position: null });
              close();
            }}
          />
        ))}
      </FilterSheet>

      <FilterSheet title="Rayon" isPresented={openSheet === 'radius'} onDismiss={close}>
        {filters.cityId === null && filters.position === null ? (
          <Text style={styles.hint}>
            Choisis d’abord une ville : le rayon se calcule autour de son centre.
          </Text>
        ) : (
          <>
            {/* Autour d'une position, « uniquement » n'a pas de sens : seuls les rayons sont proposés. */}
            {filters.position === null ? (
              <OptionRow
                label={`${cityName ?? 'Ville'} uniquement`}
                selected={filters.radiusKm === null}
                onPress={() => {
                  update({ radiusKm: null });
                  close();
                }}
              />
            ) : null}
            {RADIUS_OPTIONS.map((radius) => (
              <OptionRow
                key={radius}
                label={`À moins de ${radius} km`}
                selected={filters.radiusKm === radius}
                onPress={() => {
                  update({ radiusKm: radius });
                  close();
                }}
              />
            ))}
          </>
        )}
      </FilterSheet>

      <FilterSheet
        title="Genres"
        isPresented={openSheet === 'genre'}
        onDismiss={close}
        footer={<SecondaryButton label="Terminé" onPress={close} />}>
        {(options?.genres ?? []).map((genre) => {
          const selected = filters.genreIds.includes(genre.id);
          return (
            <OptionRow
              key={genre.id}
              label={genre.name}
              multiple
              selected={selected}
              onPress={() =>
                update({
                  genreIds: selected
                    ? filters.genreIds.filter((id) => id !== genre.id)
                    : [...filters.genreIds, genre.id],
                })
              }
            />
          );
        })}
      </FilterSheet>
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
  stale: {
    opacity: opacity.pressed,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  grow: {
    flexGrow: 1,
  },
  header: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    backgroundColor: colors.background,
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  summary: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reset: {
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  resetLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  count: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  refreshError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.alert,
    paddingHorizontal: spacing.md,
  },
  empty: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  skeletons: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cardRow: {
    paddingHorizontal: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.textSecondary,
  },
});
