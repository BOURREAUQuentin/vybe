import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, fontSizes, radius, sizes, spacing } from '@/theme/tokens';

type FilterSheetProps = {
  title: string;
  isPresented: boolean;
  onDismiss: () => void;
  /** Liste longue (ex. villes) : contenu déroulable. */
  scrollable?: boolean;
  /** Action en bas du panneau (ex. « Terminé » pour un choix multiple). */
  footer?: ReactNode;
  children: ReactNode;
};

// Panneau qui monte du bas de l'écran pour choisir un filtre.
// Basé sur le Modal de React Native (fiable dans Expo Go, iOS et Android) :
// le BottomSheet de @expo/ui rendait mal le contenu et ne laissait pas toucher les choix.
export function FilterSheet({
  title,
  isPresented,
  onDismiss,
  scrollable = false,
  footer,
  children,
}: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const options = <View style={styles.options}>{children}</View>;

  return (
    <Modal
      visible={isPresented}
      transparent
      animationType="fade"
      onRequestClose={onDismiss} // bouton ou geste retour d'Android
      statusBarTranslucent
      navigationBarTranslucent>
      <View style={styles.root}>
        {/* Toucher le fond assombri ferme le panneau. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        />
        <View
          style={[styles.panel, { paddingBottom: spacing.lg + insets.bottom }]}
          accessibilityViewIsModal>
          <View style={styles.handle} />
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {scrollable ? (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator>
              {options}
            </ScrollView>
          ) : (
            options
          )}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  panel: {
    maxHeight: sizes.sheetMaxHeight,
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  handle: {
    alignSelf: 'center',
    width: sizes.sheetHandleWidth,
    height: sizes.sheetHandleHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.text,
  },
  scroll: {
    flexGrow: 0,
    // La liste rétrécit (et défile) pour laisser le titre et le bas du panneau toujours visibles.
    flexShrink: 1,
  },
  options: {
    gap: spacing.xxs,
  },
  footer: {
    paddingTop: spacing.sm,
  },
});
