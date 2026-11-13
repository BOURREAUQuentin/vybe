import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DetailSection } from '@/components/DetailSection';
import { DetailSkeleton } from '@/components/DetailSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ArtistRow } from '@/components/ArtistRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SourceNote } from '@/components/SourceNote';
import { StatusBadge } from '@/components/StatusBadge';
import { VenueRow } from '@/components/VenueRow';
import { WishlistButton } from '@/components/WishlistButton';
import type { EventDetail } from '@/features/events/api';
import { getLineupLabels, sortLineup } from '@/features/events/lineup';
import { useEvent } from '@/features/events/useEvent';
import { formatDayAndTime, formatEventDateLong } from '@/lib/dates';
import { formatPriceRange, roleLabels } from '@/lib/format';
import { colors, fonts, fontSizes, lineHeights, maxFontScale, spacing } from '@/theme/tokens';

// Fiche concert.
export default function ConcertScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, error, refetch } = useEvent(id);

  if (data === undefined) {
    return (
      <View style={styles.container}>
        {error ? (
          <ErrorState title="Impossible de charger ce concert" onRetry={() => refetch()} />
        ) : (
          <DetailSkeleton />
        )}
      </View>
    );
  }

  if (data === null) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Concert introuvable"
          message="Ce concert a peut-être été retiré ou le lien n’est plus valide."
          action={{
            label: 'Retour',
            onPress: () => (router.canGoBack() ? router.back() : router.replace('/')),
          }}
        />
      </View>
    );
  }

  return <ConcertDetail event={data} />;
}

function ConcertDetail({ event }: { event: EventDetail }) {
  const router = useRouter();
  const { title } = getLineupLabels(event.name, event.lineup);
  const lineup = sortLineup(event.lineup);
  const price = formatPriceRange(event.price_min, event.price_max, event.currency);
  const venue = event.venue;
  const cityLine = [venue?.postal_code, venue?.city.name].filter(Boolean).join(' ');

  const isClosed = event.status === 'cancelled' || event.status === 'past';
  const ticketUrl = isClosed ? null : event.ticket_url;
  const onSaleSoon =
    event.status === 'announced' &&
    event.on_sale_at !== null &&
    new Date(event.on_sale_at) > new Date();

  const openTickets = () => {
    if (!ticketUrl) return;
    void WebBrowser.openBrowserAsync(ticketUrl, {
      toolbarColor: colors.background,
      controlsColor: colors.accent,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* V1.3 : cœur « Mes envies » en haut à droite de la barre. */}
      <Stack.Screen options={{ headerRight: () => <WishlistButton eventId={event.id} /> }} />
      {/* En-tête : affiche, statut, date, lieu */}
      <View style={styles.header}>
        <Text
          style={styles.title}
          accessibilityRole="header"
          maxFontSizeMultiplier={maxFontScale.display}>
          {title}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={event.status} />
        </View>
        <Text style={styles.date}>{formatEventDateLong(event.starts_at, event.time_tba)}</Text>
        {venue ? (
          <Text style={styles.venue}>
            {venue.name}
            {venue.city.name ? ` · ${venue.city.name}` : ''}
          </Text>
        ) : null}
      </View>

      {/* Action principale (seul élément lime de l'écran) */}
      {ticketUrl ? (
        <View style={styles.ticketBlock}>
          <PrimaryButton
            label="Billetterie"
            onPress={openTickets}
            accessibilityHint="Ouvre la billetterie dans le navigateur"
          />
          {onSaleSoon && event.on_sale_at ? (
            <Text style={styles.hint}>
              Ouverture de la billetterie le {formatDayAndTime(event.on_sale_at)}
            </Text>
          ) : null}
        </View>
      ) : null}
      {event.status === 'cancelled' ? (
        <Text style={styles.alert}>Ce concert est annulé : la billetterie est fermée.</Text>
      ) : null}
      {event.status === 'past' ? (
        <Text style={styles.hint}>Ce concert a déjà eu lieu.</Text>
      ) : null}

      {price ? (
        <DetailSection title="Prix indicatif">
          <Text style={styles.body}>{price}</Text>
        </DetailSection>
      ) : null}

      {venue ? (
        <DetailSection title="Lieu">
          {/* Ouvre la fiche salle (V1.2). */}
          <VenueRow
            name={venue.name}
            subtitle={[venue.address, cityLine].filter(Boolean).join(', ')}
            onPress={() => router.push({ pathname: '/venue/[id]', params: { id: venue.id } })}
          />
        </DetailSection>
      ) : null}

      {lineup.length > 0 ? (
        <DetailSection title="Programmation">
          {lineup.map((entry) =>
            entry.artist ? (
              <ArtistRow
                key={entry.artist.id}
                name={entry.artist.name}
                imageUrl={entry.artist.image_url}
                subtitle={roleLabels[entry.role]}
                onPress={() =>
                  router.push({
                    pathname: '/artist/[id]',
                    params: { id: entry.artist?.id ?? '' },
                  })
                }
              />
            ) : null,
          )}
        </DetailSection>
      ) : null}

      {event.description ? (
        <DetailSection title="Infos pratiques">
          <Text style={styles.body}>{event.description}</Text>
        </DetailSection>
      ) : null}

      <SourceNote source={event.source} />
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
  header: {
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * lineHeights.display,
    color: colors.text,
    textTransform: 'uppercase',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  date: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  venue: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  ticketBlock: {
    gap: spacing.xs,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  alert: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.alert,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.text,
  },
});
