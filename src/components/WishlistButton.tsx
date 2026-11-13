import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { useAuth } from '@/features/auth/AuthContext';
import { useToggleWishlist, useWishlistIds } from '@/features/wishlist/useWishlist';

type WishlistButtonProps = {
  eventId: string;
};

// Cœur « Mes envies » de la fiche concert (barre du haut). Blanc, jamais lime :
// la Billetterie reste l'action principale. Sans compte : ouvre la connexion.
// Android n'a pas de cœur plein en Material Symbols : « cœur coché » pour « enregistré ».
export function WishlistButton({ eventId }: WishlistButtonProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: ids } = useWishlistIds();
  const toggle = useToggleWishlist();

  const isSaved = ids?.includes(eventId) ?? false;

  const onPress = () => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }
    toggle.mutate(
      { eventId, add: !isSaved },
      {
        onError: () =>
          Alert.alert('Envie non enregistrée', 'Vérifie ta connexion internet et réessaie.'),
      },
    );
  };

  return (
    <IconButton
      icon={
        isSaved
          ? { ios: 'heart.fill', android: 'heart_check' }
          : { ios: 'heart', android: 'favorite' }
      }
      accessibilityLabel={isSaved ? 'Retirer de mes envies' : 'Ajouter à mes envies'}
      onPress={onPress}
    />
  );
}
