import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { EventDetail } from '@/features/events/api';
import { sortLineup } from '@/features/events/lineup';
import { useEvent } from '@/features/events/useEvent';
import { formatPriceRange, roleLabels, sourceLabels } from '@/lib/format';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { derived } from '@/mockups/shared/motion';
import { MockupState } from '@/mockups/shared/MockupState';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupConcertProps } from '@/mockups/shared/types';
import { colors, fonts, fontSizes, iconSizes, lineHeights, maxFontScale, opacity, spacing, touch } from '@/theme/tokens';

import { Caps, PosterBackground, PosterTitle, Sticker, WishSticker } from './components';
import { affiche } from './tokens';

// AFFICHE — fiche concert : affiche plein écran, titre géant, line-up hiérarchisé comme sur une affiche.
export function AfficheConcert({ eventId, nav }: MockupConcertProps) {
  const { data, error, refetch } = useEvent(eventId);
  if (!data) return <MockupState error={error} onRetry={() => void refetch()} />;
  return <Detail event={data} onBack={nav.goBack} />;
}

function Detail({ event, onBack }: { event: EventDetail; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const [isWished, setIsWished] = useState(false);
  const view = describeEvent(event);
  const price = formatPriceRange(event.price_min, event.price_max, event.currency);
  const lineup = sortLineup(event.lineup);
  const ticketUrl = view.isCancelled || event.status === 'past' ? null : event.ticket_url;

  const facts = [
    { label: 'Date', value: `${view.weekday} ${view.day} ${view.month}` },
    { label: 'Heure', value: view.time },
    { label: 'Salle', value: view.venueName },
    { label: 'Ville', value: view.cityName },
    { label: 'Prix', value: price },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  const toggleWish = () => {
    if (isWished) haptics.tap();
    else haptics.thud();
    setIsWished(!isWished);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomSpace }}>
        <View style={styles.poster}>
          <PosterBackground view={view} initialsSize={affiche.size.heroInitials} />
          <View style={styles.posterText}>
            <View style={styles.stickers}>
              <Sticker status={view.status} />
              {isWished ? <WishSticker /> : null}
            </View>
            <PosterTitle text={view.title} size={affiche.size.mega} />
            {view.others ? <Caps muted={false}>{`+ ${view.others}`}</Caps> : null}
          </View>
        </View>

        {/* Pied d'affiche : informations pratiques en grille. */}
        <View style={styles.facts}>
          {facts.map((fact) => (
            <View key={fact.label} style={styles.fact}>
              <Caps>{fact.label}</Caps>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          {ticketUrl ? (
            <PressableScale
              onPress={() => {
                haptics.tap();
                void WebBrowser.openBrowserAsync(ticketUrl);
              }}
              accessibilityRole="button"
              accessibilityLabel="Billetterie"
              accessibilityHint="Ouvre la billetterie dans le navigateur"
              style={styles.ticketButton}>
              <Text style={styles.ticketText}>BILLETTERIE →</Text>
            </PressableScale>
          ) : null}

          <Caps>Line-up</Caps>
          {/* Hiérarchie d'affiche : la tête d'affiche en gros, les autres en plus petit. */}
          {lineup.map((entry) =>
            entry.artist ? (
              <View key={entry.artist.id} style={styles.lineupRow}>
                <Text
                  style={[
                    styles.lineupName,
                    entry.role === 'headliner' || entry.role === 'co_headliner'
                      ? styles.lineupMain
                      : styles.lineupOther,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={maxFontScale.display}>
                  {entry.artist.name.toUpperCase()}
                </Text>
                <Caps>{roleLabels[entry.role]}</Caps>
              </View>
            ) : null,
          )}

          {event.description ? <Text style={styles.body}>{event.description}</Text> : null}
          <Caps>{sourceLabels[event.source]}</Caps>
        </View>
      </ScrollView>

      {/* Boutons flottants sur l'affiche. */}
      <View style={[styles.topBar, { top: insets.top + spacing.xs }]}>
        <RoundButton icon={{ ios: 'chevron.left', android: 'arrow_back' }} label="Retour" onPress={onBack} />
        <RoundButton
          icon={isWished ? { ios: 'heart.fill', android: 'heart_check' } : { ios: 'heart', android: 'favorite' }}
          label={isWished ? 'Retirer de mes envies' : 'Ajouter à mes envies'}
          onPress={toggleWish}
        />
      </View>
    </View>
  );
}

type RoundButtonProps = {
  icon: ComponentProps<typeof SymbolView>['name'];
  label: string;
  onPress: () => void;
};

function RoundButton({ icon, label, onPress }: RoundButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
      <SymbolView name={icon} size={iconSizes.md} tintColor={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  poster: {
    height: affiche.detailPosterHeight,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  posterText: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  stickers: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: derived.hairlineStrong,
  },
  fact: {
    width: '50%',
    gap: spacing.xxs,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: derived.hairlineStrong,
  },
  factValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  section: {
    padding: spacing.md,
    gap: spacing.md,
  },
  ticketButton: {
    minHeight: touch.minSize + spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  ticketText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.display,
    color: colors.onAccent,
    letterSpacing: affiche.capsSpacing,
  },
  lineupRow: {
    gap: spacing.xxs,
  },
  lineupName: {
    fontFamily: fonts.display,
    color: colors.text,
  },
  lineupMain: {
    fontSize: affiche.size.lineupMain,
    lineHeight: affiche.size.lineupMain * lineHeights.display,
  },
  lineupOther: {
    fontSize: affiche.size.lineupOther,
    lineHeight: affiche.size.lineupOther * lineHeights.display,
    color: colors.textSecondary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.textSecondary,
  },
  topBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  round: {
    width: touch.minSize,
    height: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: derived.scrim,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
