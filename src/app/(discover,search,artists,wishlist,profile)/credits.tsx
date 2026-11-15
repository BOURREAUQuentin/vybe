import * as Linking from 'expo-linking';
import { SymbolView } from 'expo-symbols';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { DetailSkeleton } from '@/components/DetailSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { usePhotoCredits, type PhotoCredit } from '@/features/infos/api';
import { useTabBarSpace } from '@/lib/useTabBarSpace';
import { colors, fonts, fontSizes, iconSizes, lineHeights, opacity, spacing, touch } from '@/theme/tokens';

// « Crédits photos » (V1.1) : auteur et licence de chaque photo de ville (Wikimedia Commons).
// Obligatoire pour les licences CC BY / CC BY-SA ; toucher une ligne ouvre la page de la photo.
export default function CreditsScreen() {
  // Le bas de la liste ne doit pas rester caché sous la barre d'onglets (iOS).
  const bottomSpace = useTabBarSpace();
  const { data, error, refetch } = usePhotoCredits();

  if (data === undefined) {
    return (
      <View style={styles.container}>
        {error ? <ErrorState title="Impossible de charger les crédits" onRetry={() => refetch()} /> : <DetailSkeleton />}
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={data}
      keyExtractor={(credit) => credit.id}
      contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}
      ListHeaderComponent={
        <Text style={styles.intro}>
          Les photos des villes viennent de Wikimedia Commons et sont publiées sous licence libre (domaine
          public, CC0, CC BY ou CC BY-SA). Merci à leurs auteurs.
        </Text>
      }
      renderItem={({ item }) => <CreditRow credit={item} />}
      ItemSeparatorComponent={Separator}
    />
  );
}

function CreditRow({ credit }: { credit: PhotoCredit }) {
  const source = credit.image_source_url;
  return (
    <Pressable
      disabled={!source}
      onPress={() => {
        if (source) Linking.openURL(source).catch(() => undefined);
      }}
      accessibilityRole="link"
      accessibilityLabel={`${credit.name} : ${credit.image_credit ?? ''}`}
      accessibilityHint="Ouvre la page de la photo"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.text}>
        <Text style={styles.city}>{credit.name}</Text>
        <Text style={styles.credit}>{credit.image_credit}</Text>
      </View>
      {source ? (
        <SymbolView
          name={{ ios: 'arrow.up.right', android: 'open_in_new' }}
          size={iconSizes.sm}
          tintColor={colors.textSecondary}
        />
      ) : null}
    </Pressable>
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
  content: {
    padding: spacing.md,
  },
  intro: {
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.textSecondary,
  },
  row: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  city: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  credit: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
});
