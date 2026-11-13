import { useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';

import { DetailSection } from '@/components/DetailSection';
import { SecondaryButton } from '@/components/SecondaryButton';
import { collectMyData, deleteMyAccount, formatMyData } from '@/features/account/api';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, fonts, fontSizes, lineHeights, spacing } from '@/theme/tokens';

/** Délai après la fermeture du menu de partage pendant lequel le Profil ignore encore les touchers. */
const SHARE_TOUCH_GUARD_MS = 600;

type MyDataSectionProps = {
  /**
   * Prévient l'écran quand le menu de partage est ouvert (et un court instant après sa fermeture),
   * pour qu'il ignore le toucher qui ferme le menu.
   */
  onShareStateChange?: (isSharing: boolean) => void;
};

// « Mes données » du Profil (V1.3, RGPD) : export (accès, portabilité) et suppression du compte.
export function MyDataSection({ onShareStateChange }: MyDataSectionProps) {
  const { session, email, userId } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    try {
      const data = await collectMyData({
        email,
        createdAt: session?.user.created_at ?? null,
      });
      // Menu de partage du téléphone : Mail, Notes, Fichiers…
      onShareStateChange?.(true);
      await Share.share({ title: 'Mes données Vybe', message: formatMyData(data) });
    } catch {
      Alert.alert('Export impossible', 'Vérifie ta connexion internet et réessaie.');
    } finally {
      setIsExporting(false);
      // Le toucher qui a fermé le menu peut arriver juste après : on le laisse passer « dans le vide ».
      setTimeout(() => onShareStateChange?.(false), SHARE_TOUCH_GUARD_MS);
    }
  };

  const deleteAccount = async () => {
    if (!userId) return;
    setIsDeleting(true);
    try {
      await deleteMyAccount(userId);
      Alert.alert('Compte supprimé', 'Ton compte et toutes tes données ont été effacés.');
    } catch {
      setIsDeleting(false);
      Alert.alert(
        'Suppression impossible',
        'Rien n’a été supprimé. Vérifie ta connexion internet et réessaie.',
      );
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      'Supprimer ton compte ?',
      'Ton compte, tes artistes suivis, tes envies et tes favoris seront définitivement effacés. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => void deleteAccount() },
      ],
    );

  return (
    <DetailSection title="Mes données">
      <Text style={styles.help}>
        Récupère une copie lisible de tes données (e-mail, artistes suivis, envies, favoris).
      </Text>
      <View style={styles.action}>
        <SecondaryButton
          label="Exporter mes données"
          loading={isExporting}
          accessibilityHint="Ouvre le menu de partage avec une copie de tes données"
          onPress={() => void exportData()}
        />
      </View>

      <Text style={[styles.help, styles.spaced]}>
        Supprime définitivement ton compte et toutes tes données.
      </Text>
      <View style={styles.action}>
        <SecondaryButton
          label="Supprimer mon compte"
          tone="danger"
          loading={isDeleting}
          accessibilityHint="Demande une confirmation avant de tout supprimer"
          onPress={confirmDelete}
        />
      </View>
    </DetailSection>
  );
}

const styles = StyleSheet.create({
  help: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.textSecondary,
  },
  spaced: {
    marginTop: spacing.sm,
  },
  action: {
    alignItems: 'flex-start',
  },
});
