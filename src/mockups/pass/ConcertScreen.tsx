import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SlideInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { EventDetail } from '@/features/events/api';
import { sortLineup } from '@/features/events/lineup';
import { useEvent } from '@/features/events/useEvent';
import { formatPriceRange, roleLabels, sourceLabels } from '@/lib/format';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { describeEvent } from '@/mockups/shared/eventView';
import { haptics } from '@/mockups/shared/haptics';
import { motion } from '@/mockups/shared/motion';
import { MockupState } from '@/mockups/shared/MockupState';
import { PressableScale } from '@/mockups/shared/PressableScale';
import type { MockupConcertProps } from '@/mockups/shared/types';
import {
  colors,
  fonts,
  fontSizes,
  iconSizes,
  lineHeights,
  maxFontScale,
  opacity,
  radius,
  spacing,
  touch,
} from '@/theme/tokens';

import { Barcode, Field, HorizontalPerforation, Label, PassPhoto, Stamp } from './components';
import { pass } from './tokens';

// PASS — fiche concert : un grand pass vertical qui monte du bas ; ajouter une envie « tamponne » le billet.
export function PassConcert({ eventId, nav }: MockupConcertProps) {
  const { data, error, refetch } = useEvent(eventId);
  if (!data) return <MockupState error={error} onRetry={() => void refetch()} />;
  return <Detail event={data} onBack={nav.goBack} />;
}

function Detail({ event, onBack }: { event: EventDetail; onBack: () => void }) {
  const bottomSpace = useTabBarSpace();
  const reduceMotion = useReducedMotion();
  const [isWished, setIsWished] = useState(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));

  const view = describeEvent(event);
  const price = formatPriceRange(event.price_min, event.price_max, event.currency);
  const ticketUrl = view.isCancelled || event.status === 'past' ? null : event.ticket_url;

  const toggleWish = () => {
    if (!isWished) {
      haptics.thud();
      if (!reduceMotion) {
        const step = { duration: motion.fadeMs / 6 };
        shake.set(
          withSequence(
            withTiming(pass.shakeOffset, step),
            withTiming(-pass.shakeOffset, step),
            withTiming(pass.shakeOffset / 2, step),
            withTiming(0, step),
          ),
        );
      }
    } else {
      haptics.tap();
    }
    setIsWished(!isWished);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <IconCircle icon={{ ios: 'chevron.left', android: 'arrow_back' }} label="Retour" onPress={onBack} />
        <Label>{`Pass · N° ${view.id.slice(0, 8).toUpperCase()}`}</Label>
        <IconCircle
          icon={isWished ? { ios: 'heart.fill', android: 'heart_check' } : { ios: 'heart', android: 'favorite' }}
          label={isWished ? 'Retirer de mes envies' : 'Ajouter à mes envies'}
          onPress={toggleWish}
        />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}>
        <Animated.View
          entering={SlideInDown.springify().damping(motion.spring.damping).stiffness(motion.spring.stiffness)}
          style={[styles.pass, shakeStyle]}>
          <PassPhoto view={view} height={pass.detailPhotoHeight}>
            <View style={styles.stamps}>
              {view.status !== 'announced' ? <Stamp status={view.status} /> : null}
              {isWished ? <Stamp status="announced" label="♥ Envie" /> : null}
            </View>
          </PassPhoto>

          <View style={styles.body}>
            <Text style={styles.title} maxFontSizeMultiplier={maxFontScale.display} accessibilityRole="header">
              {view.title.toUpperCase()}
            </Text>
            {view.others ? <Text style={styles.others}>avec {view.others}</Text> : null}

            <View style={styles.grid}>
              <Field label="Date" value={`${view.weekday} ${view.day} ${view.month}`} style={styles.cell} />
              <Field label="Heure" value={view.time} style={styles.cell} />
              <Field label="Salle" value={view.venueName ?? '—'} style={styles.cell} />
              <Field label="Ville" value={view.cityName ?? '—'} style={styles.cell} />
              {price ? <Field label="Prix" value={price} style={styles.cell} /> : null}
              <Field label="Statut" value={view.statusLabel} style={styles.cell} />
            </View>
          </View>

          <HorizontalPerforation />
          <View style={styles.footer}>
            <Barcode id={view.id} />
          </View>
        </Animated.View>

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
            <Text style={styles.ticketText}>Billetterie</Text>
          </PressableScale>
        ) : null}

        <View style={styles.section}>
          <Label>Programme</Label>
          {sortLineup(event.lineup).map((entry, index) =>
            entry.artist ? (
              <View key={entry.artist.id} style={styles.lineupRow}>
                <Text style={styles.lineupIndex}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.lineupName} numberOfLines={1}>
                  {entry.artist.name}
                </Text>
                <Label>{roleLabels[entry.role]}</Label>
              </View>
            ) : null,
          )}
        </View>

        {event.description ? (
          <View style={styles.section}>
            <Label>À propos</Label>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        ) : null}
        <Label>{sourceLabels[event.source]}</Label>
      </ScrollView>
    </SafeAreaView>
  );
}

type IconCircleProps = {
  icon: ComponentProps<typeof SymbolView>['name'];
  label: string;
  onPress: () => void;
};

function IconCircle({ icon, label, onPress }: IconCircleProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.circle, pressed && styles.pressed]}>
      <SymbolView name={icon} size={iconSizes.md} tintColor={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  circle: {
    width: touch.minSize,
    height: touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  pass: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  stamps: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  body: {
    gap: spacing.md,
    padding: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: pass.size.passTitle,
    lineHeight: pass.size.passTitle * lineHeights.display,
    color: colors.text,
  },
  others: {
    marginTop: -spacing.sm,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
  },
  cell: {
    width: '50%',
    paddingRight: spacing.sm,
  },
  footer: {
    padding: spacing.md,
  },
  ticketButton: {
    minHeight: touch.minSize + spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  ticketText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.onAccent,
  },
  section: {
    gap: spacing.xs,
  },
  lineupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.minSize,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  lineupIndex: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
  },
  lineupName: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    color: colors.textSecondary,
  },
});
