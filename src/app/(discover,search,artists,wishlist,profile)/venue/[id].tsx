import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { DetailTopBar } from '@/components/DetailTopBar';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FavoriteVenueButton } from '@/components/FavoriteVenueButton';
import { GlassPill } from '@/components/GlassPill';
import { PhotoDetailSkeleton } from '@/components/PhotoDetailSkeleton';
import { PhotoHeader } from '@/components/PhotoHeader';
import { SecondaryButton } from '@/components/SecondaryButton';
import { SectionTitle } from '@/components/SectionTitle';
import { Ticket } from '@/components/Ticket';
import { TicketLabel } from '@/components/TicketLabel';
import { describeEvent } from '@/features/events/eventView';
import type { VenueWithEvents } from '@/features/venues/api';
import { useVenue } from '@/features/venues/useVenue';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { openDirections } from '@/lib/maps';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import {
  colors,
  fonts,
  fontSizes,
  iconSizes,
  lineHeights,
  maxFontScale,
  radius,
  spacing,
  touch,
} from '@/theme/tokens';

// Fiche salle (direction Hybride) : en-tête illustré par l'artiste d'un prochain concert ici
// (les salles n'ont pas de photo), Ajouter à mes salles (seul lime), adresse et itinéraire,
// concerts en billets. Barre native masquée : bouton retour en verre.
export default function VenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, refetch } = useVenue(id);

  let content: ReactNode;
  if (data === undefined) {
    content = error ? (
      <View style={styles.centered}>
        <ErrorState title="Impossible de charger cette salle" onRetry={() => refetch()} />
      </View>
    ) : (
      <PhotoDetailSkeleton />
    );
  } else if (data === null) {
    content = (
      <View style={styles.centered}>
        <EmptyState title="Salle introuvable" message="Cette fiche n’existe plus ou le lien n’est plus valide." />
      </View>
    );
  } else {
    content = <VenueDetail venue={data.venue} events={data.events} />;
  }

  return (
    <View style={styles.container}>
      {content}
      <DetailTopBar />
    </View>
  );
}

function VenueDetail({ venue, events }: VenueWithEvents) {
  const router = useRouter();
  // Le bas du contenu ne doit pas rester caché sous la barre d'onglets (iOS).
  const bottomSpace = useTabBarSpace();
  const { data: wishIds } = useWishlistIds();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const views = events.map(describeEvent);
  // Illustration : le premier concert à venir dont l'artiste a une photo, annoncé honnêtement.
  const featured = views.find((view) => view.imageUrl !== null) ?? null;
  const cityLine = [venue.postal_code, venue.city.name].filter(Boolean).join(' ');
  // Lieu pour l'itinéraire, seulement si les coordonnées sont connues.
  const place =
    venue.latitude !== null && venue.longitude !== null
      ? { name: venue.name, latitude: venue.latitude, longitude: venue.longitude }
      : null;

  return (
    <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: bottomSpace }}>
      <PhotoHeader name={venue.name} imageUrl={featured?.imageUrl ?? null} scrollY={scrollY} placeholder="place">
        {featured ? <GlassPill label={`Bientôt ici : ${featured.title} · ${featured.weekday} ${featured.day} ${featured.month}`} /> : null}
        <Text style={styles.name} accessibilityRole="header" numberOfLines={2} maxFontSizeMultiplier={maxFontScale.display}>
          {venue.name.toUpperCase()}
        </Text>
        <Text style={styles.city}>{venue.city.name}</Text>
      </PhotoHeader>

      <View style={styles.body}>
        {/* Seule action principale (lime) de la fiche salle. */}
        <FavoriteVenueButton venue={venue} />

        {/* Adresse façon billet : icône, étiquette, adresse, itinéraire. */}
        {venue.address || cityLine || place ? (
          <View style={styles.addressCard}>
            <View style={styles.addressRow}>
              <View style={styles.addressIcon}>
                <SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on' }} size={iconSizes.md} tintColor={colors.text} />
              </View>
              <View style={styles.addressText}>
                <TicketLabel>Adresse</TicketLabel>
                {venue.address ? <Text style={styles.addressLine}>{venue.address}</Text> : null}
                {cityLine ? <Text style={styles.addressSub}>{cityLine}</Text> : null}
              </View>
            </View>
            {place ? (
              <SecondaryButton
                label="Itinéraire"
                accessibilityHint="Ouvre l’application de cartes du téléphone"
                onPress={() => openDirections(place)}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionTitle title={events.length > 0 ? `Concerts à venir · ${events.length}` : 'Concerts à venir'} />
        {views.length > 0 ? (
          <View style={styles.tickets}>
            {views.map((view) => (
              <Ticket
                key={view.id}
                view={view}
                isWished={wishIds?.includes(view.id) ?? false}
                onPress={() => router.push({ pathname: '/concert/[id]', params: { id: view.id } })}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Aucun concert à venir dans cette salle.</Text>
        )}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.display,
    fontSize: fontSizes.detailTitle,
    lineHeight: fontSizes.detailTitle * lineHeights.display,
    color: colors.text,
  },
  city: {
    marginTop: -spacing.sm,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  body: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  addressCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addressIcon: {
    width: touch.minSize,
    height: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  addressText: {
    flex: 1,
    gap: spacing.xxs,
  },
  addressLine: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  addressSub: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  tickets: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  empty: {
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
});
