import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FilterSheet } from '@/components/FilterSheet';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useUpcomingEvents } from '@/features/events/useUpcomingEvents';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { colors, fonts, fontSizes, opacity, radius, spacing, touch } from '@/theme/tokens';

import { directions } from './directions';
import { pickShowcaseEvent } from './shared/eventView';
import { haptics } from './shared/haptics';
import { derived } from './shared/motion';
import type { MockupNav, MockupScreenName } from './shared/types';

const SCREENS: { key: MockupScreenName; label: string }[] = [
  { key: 'discover', label: 'Découvrir' },
  { key: 'concert', label: 'Fiche concert' },
  { key: 'search', label: 'Recherche' },
];

type Place = { screen: MockupScreenName; eventId: string | null };

// Laboratoire de maquettes (développement uniquement) : choisir une direction et un écran.
// La navigation est simulée ici, sans ouvrir de vraies routes de l'application.
export function MockupsLab() {
  const router = useRouter();
  const bottomSpace = useTabBarSpace();
  const { data: upcoming } = useUpcomingEvents();
  const [directionIndex, setDirectionIndex] = useState(0);
  const [history, setHistory] = useState<Place[]>([{ screen: 'discover', eventId: null }]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const direction = directions[directionIndex];
  const current = history[history.length - 1];
  const showcaseId = upcoming ? (pickShowcaseEvent(upcoming)?.id ?? null) : null;
  const concertId = current.eventId ?? showcaseId;

  const nav: MockupNav = {
    openConcert: (id) => setHistory((previous) => [...previous, { screen: 'concert', eventId: id }]),
    goBack: () => setHistory((previous) => (previous.length > 1 ? previous.slice(0, -1) : previous)),
  };

  const show = (screen: MockupScreenName) => {
    haptics.select();
    setHistory([{ screen, eventId: null }]);
  };

  const { Discover, Concert, Search } = direction;
  const screenLabel = SCREENS.find((item) => item.key === current.screen)?.label ?? '';

  return (
    <View style={styles.container}>
      {/* La clé remonte l'écran à chaque changement : les animations d'entrée se rejouent. */}
      <View style={styles.container} key={`${direction.key}-${history.length}-${current.screen}`}>
        {current.screen === 'discover' ? <Discover nav={nav} /> : null}
        {current.screen === 'search' ? <Search nav={nav} /> : null}
        {current.screen === 'concert' && concertId ? <Concert nav={nav} eventId={concertId} /> : null}
      </View>

      {/* Pastille flottante : ouvre le sélecteur de direction et d'écran. */}
      <Pressable
        onPress={() => setIsPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Maquette ${direction.name}, ${screenLabel}. Changer`}
        style={({ pressed }) => [styles.pill, { bottom: bottomSpace - spacing.md }, pressed && styles.pressed]}>
        <Text style={styles.pillText}>
          {direction.name.toUpperCase()} · {screenLabel} ⌃
        </Text>
      </Pressable>

      <FilterSheet
        title="Maquettes"
        isPresented={isPickerOpen}
        onDismiss={() => setIsPickerOpen(false)}
        footer={<PrimaryButton label="Quitter les maquettes" onPress={() => router.back()} />}>
        <Text style={styles.groupLabel}>DIRECTION</Text>
        {directions.map((item, index) => (
          <Choice
            key={item.key}
            label={`${index + 1}. ${item.name}`}
            hint={item.intent}
            isSelected={index === directionIndex}
            onPress={() => {
              haptics.select();
              setDirectionIndex(index);
            }}
          />
        ))}
        <Text style={styles.groupLabel}>ÉCRAN</Text>
        {SCREENS.map((item) => (
          <Choice
            key={item.key}
            label={item.label}
            isSelected={item.key === current.screen}
            onPress={() => {
              show(item.key);
              setIsPickerOpen(false);
            }}
          />
        ))}
      </FilterSheet>
    </View>
  );
}

function Choice({
  label,
  hint,
  isSelected,
  onPress,
}: {
  label: string;
  hint?: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [styles.choice, isSelected && styles.choiceSelected, pressed && styles.pressed]}>
      <Text style={styles.choiceLabel}>
        {label}
        {isSelected ? '  ✓' : ''}
      </Text>
      {hint ? <Text style={styles.choiceHint}>{hint}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pill: {
    position: 'absolute',
    right: spacing.md,
    minHeight: touch.minSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: derived.hairlineStrong,
    backgroundColor: colors.surfaceRaised,
  },
  pillText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.text,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  groupLabel: {
    marginTop: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  choice: {
    minHeight: touch.minSize,
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  choiceSelected: {
    backgroundColor: colors.surfaceRaised,
  },
  choiceLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  choiceHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
