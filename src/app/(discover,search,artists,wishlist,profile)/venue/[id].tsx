import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DetailSection } from '@/components/DetailSection';
import { DetailSkeleton } from '@/components/DetailSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { EventCard } from '@/components/EventCard';
import { FavoriteVenueButton } from '@/components/FavoriteVenueButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import type { VenueWithEvents } from '@/features/venues/api';
import { useVenue } from '@/features/venues/useVenue';
import { openDirections } from '@/lib/maps';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  maxFontScale,
  spacing,
} from '@/theme/tokens';

// Fiche salle (V1.2) : adresse, itinéraire, concerts à venir.
export default function VenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, error, refetch } = useVenue(id);

  if (data === undefined) {
    return (
      <View style={styles.container}>
        {error ? (
          <ErrorState title="Impossible de charger cette salle" onRetry={() => refetch()} />
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
          title="Salle introuvable"
          message="Cette fiche n’existe plus ou le lien n’est plus valide."
          action={{
            label: 'Retour',
            onPress: () => (router.canGoBack() ? router.back() : router.replace('/')),
          }}
        />
      </View>
    );
  }

  return <VenueDetail venue={data.venue} events={data.events} />;
}

function VenueDetail({ venue, events }: VenueWithEvents) {
  const router = useRouter();
  // Le bas du contenu ne doit pas rester caché sous la barre d'onglets (iOS).
  const bottomSpace = useTabBarSpace();
  const cityLine = [venue.postal_code, venue.city.name].filter(Boolean).join(' ');
  // Lieu pour l'itinéraire, seulement si les coordonnées sont connues.
  const place =
    venue.latitude !== null && venue.longitude !== null
      ? { name: venue.name, latitude: venue.latitude, longitude: venue.longitude }
      : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}>
      <View style={styles.header}>
        <Text
          style={styles.title}
          accessibilityRole="header"
          maxFontSizeMultiplier={maxFontScale.display}>
          {venue.name}
        </Text>
        <Text style={styles.city}>{venue.city.name}</Text>
      </View>

      {/* V1.3 : seule action principale (lime) de la fiche salle. */}
      <FavoriteVenueButton venue={venue} />

      {venue.address || cityLine || place ? (
        <DetailSection title="Adresse">
          {venue.address ? <Text style={styles.body}>{venue.address}</Text> : null}
          {cityLine ? <Text style={styles.body}>{cityLine}</Text> : null}
          {place ? (
            <View style={styles.action}>
              <SecondaryButton
                label="Itinéraire"
                accessibilityHint="Ouvre l’application de cartes du téléphone"
                onPress={() => openDirections(place)}
              />
            </View>
          ) : null}
        </DetailSection>
      ) : null}

      <DetailSection
        title={events.length > 0 ? `Concerts à venir · ${events.length}` : 'Concerts à venir'}>
        {events.length > 0 ? (
          <View style={styles.events}>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() =>
                  router.push({ pathname: '/concert/[id]', params: { id: event.id } })
                }
              />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Aucun concert à venir dans cette salle.</Text>
        )}
      </DetailSection>
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
    gap: spacing.xxs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * lineHeights.display,
    color: colors.text,
    textTransform: 'uppercase',
  },
  city: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.text,
  },
  action: {
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  events: {
    gap: spacing.xs,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
});
