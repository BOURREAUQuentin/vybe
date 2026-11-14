import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { FilterSheet } from '@/components/FilterSheet';
import { OptionRow } from '@/components/OptionRow';
import { SecondaryButton } from '@/components/SecondaryButton';
import { SectionTitle } from '@/components/SectionTitle';
import { Ticket } from '@/components/Ticket';
import { TicketSkeleton } from '@/components/TicketSkeleton';
import { describeEvent } from '@/features/events/eventView';
import { useFilterOptions } from '@/features/filters/useFilteredEvents';
import { locateFailureMessages } from '@/features/nearby/location';
import { useNearby, type NearbyPlace } from '@/features/nearby/NearbyContext';
import { toRadiusOption, useNearbyEvents } from '@/features/nearby/useNearbyEvents';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
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

const PREVIEW_COUNT = 5;

/** Paramètres de l'écran « Concerts » pour voir tous les concerts proches. */
function concertsParams(place: NearbyPlace, radiusKm: number) {
  const radiusParam = String(toRadiusOption(radiusKm));
  return place.kind === 'city'
    ? { city: place.cityId, radius: radiusParam }
    : {
        lat: String(place.position.latitude),
        lng: String(place.position.longitude),
        radius: radiusParam,
      };
}

// Section « Près de chez toi » de Découvrir (V1.2) : géolocalisation facultative ou ville choisie.
export function NearbySection() {
  const router = useRouter();
  const { place, radiusKm, canClear, isLocating, locateError, locate, chooseCity, clear } =
    useNearby();
  const nearbyRadius = toRadiusOption(radiusKm);
  const [chooserOpen, setChooserOpen] = useState(false);
  const { data: options } = useFilterOptions();
  const { data, error, refetch } = useNearbyEvents(place, nearbyRadius);
  const { data: wishIds } = useWishlistIds();

  const title = !place
    ? 'Près de chez toi'
    : place.kind === 'city'
      ? `Près de ${place.name}`
      : 'Près de toi';

  const errorBlock = locateError ? (
    <View style={styles.errorBlock}>
      <Text style={styles.errorText}>{locateFailureMessages[locateError]}</Text>
      {locateError === 'blocked' || locateError === 'services-off' ? (
        <View style={styles.inlineAction}>
          <SecondaryButton
            label="Ouvrir les réglages"
            onPress={() => {
              Linking.openSettings().catch(() => undefined);
            }}
          />
        </View>
      ) : null}
    </View>
  ) : null;

  // Choix du lieu : se localiser ou une ville. « Effacer » est en bas du panneau, hors de la
  // liste qui défile : toujours visible, même avec beaucoup de villes.
  const chooser = (
    <FilterSheet
      title="Près de…"
      isPresented={chooserOpen}
      onDismiss={() => setChooserOpen(false)}
      scrollable
      footer={
        canClear ? (
          <SecondaryButton
            label="Effacer mon choix"
            accessibilityHint="Oublie la ville ou la position choisie"
            onPress={() => {
              clear();
              setChooserOpen(false);
            }}
          />
        ) : undefined
      }>
      <OptionRow
        label="Me localiser"
        selected={place?.kind === 'position'}
        onPress={() => {
          setChooserOpen(false);
          void locate();
        }}
      />
      {(options?.cities ?? []).map((city) => (
        <OptionRow
          key={city.id}
          label={city.name}
          selected={place?.kind === 'city' && place.cityId === city.id}
          onPress={() => {
            chooseCity({ cityId: city.id, name: city.name });
            setChooserOpen(false);
          }}
        />
      ))}
    </FilterSheet>
  );

  // Aucun lieu choisi : invitation à se localiser ou à choisir une ville.
  if (!place) {
    return (
      <View style={styles.section}>
        <SectionTitle title={title} />
        <View style={styles.card}>
          <Text style={styles.intro}>
            Trouve les concerts autour de toi, dans un rayon de {nearbyRadius} km.
          </Text>
          <View style={styles.actions}>
            <SecondaryButton
              label={isLocating ? 'Localisation…' : 'Me localiser'}
              loading={isLocating}
              accessibilityHint="Demande ta position approximative, qui n’est jamais enregistrée"
              onPress={() => {
                void locate();
              }}
            />
            <SecondaryButton
              label="Choisir une ville"
              disabled={isLocating}
              onPress={() => setChooserOpen(true)}
            />
          </View>
          {errorBlock}
        </View>
        {chooser}
      </View>
    );
  }

  let content;
  if (data === undefined) {
    content = error ? (
      <View style={styles.errorBlock}>
        <Text style={styles.errorText}>Impossible de charger les concerts proches.</Text>
        <View style={styles.inlineAction}>
          <SecondaryButton label="Réessayer" onPress={() => refetch()} />
        </View>
      </View>
    ) : (
      <View style={styles.cards} accessibilityLabel="Chargement des concerts proches">
        <TicketSkeleton />
        <TicketSkeleton />
      </View>
    );
  } else if (data.length === 0) {
    content = (
      <Text style={styles.empty}>
        Aucun concert à moins de {nearbyRadius} km pour le moment.
      </Text>
    );
  } else {
    content = (
      <>
        <View style={styles.cards}>
          {data.slice(0, PREVIEW_COUNT).map((event) => (
            <Ticket
              key={event.id}
              view={describeEvent(event)}
              isWished={wishIds?.includes(event.id) ?? false}
              onPress={() => router.push({ pathname: '/concert/[id]', params: { id: event.id } })}
            />
          ))}
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/concerts', params: concertsParams(place, nearbyRadius) })}
          accessibilityRole="link"
          accessibilityLabel={`Voir les ${data.length} concerts à moins de ${nearbyRadius} km`}
          style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}>
          <Text style={styles.seeAllLabel}>
            Tout voir ({data.length}) ›
          </Text>
        </Pressable>
      </>
    );
  }

  return (
    <View style={styles.section}>
      <SectionTitle
        title={title}
        action={{
          label: 'Modifier',
          accessibilityLabel: 'Modifier le lieu de « Près de chez toi »',
          onPress: () => setChooserOpen(true),
        }}
      />
      <View style={styles.body}>
        <Text style={styles.radius}>
          {place.kind === 'city' && place.isMain
            ? `Ta ville principale · dans un rayon de ${nearbyRadius} km`
            : `Dans un rayon de ${nearbyRadius} km`}
        </Text>
        {isLocating ? <Text style={styles.radius}>Localisation en cours…</Text> : null}
        {errorBlock}
        {content}
      </View>
      {chooser}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  intro: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  body: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  radius: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  cards: {
    gap: spacing.sm,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  errorBlock: {
    gap: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.alert,
  },
  inlineAction: {
    alignItems: 'flex-start',
  },
  seeAll: {
    minHeight: touch.minSize,
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  pressed: {
    opacity: opacity.pressed,
  },
  seeAllLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
