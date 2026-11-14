import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GlassIconButton } from '@/components/GlassIconButton';
import { useAuth } from '@/features/auth/AuthContext';
import { useToggleWishlist, useWishlistIds } from '@/features/wishlist/useWishlist';
import { haptics } from '@/lib/haptics';
import { motion } from '@/theme/tokens';

// Cœur « Mes envies » en verre, posé sur la photo de la fiche concert. Blanc, jamais lime :
// la Billetterie reste l'action principale. Enregistré : fond blanc plein + petit « pop ».
// Sans compte : ouvre la connexion. Android n'a pas de cœur plein en Material Symbols : « cœur coché ».
export function WishlistGlassButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: ids } = useWishlistIds();
  const toggle = useToggleWishlist();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const isSaved = ids?.includes(eventId) ?? false;

  const onPress = () => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }
    if (isSaved) {
      haptics.tap();
    } else {
      haptics.success();
      if (!reduceMotion) {
        const step = { duration: motion.likeMs / 2 };
        scale.set(withSequence(withTiming(motion.heartBump, step), withTiming(1, step)));
      }
    }
    toggle.mutate(
      { eventId, add: !isSaved },
      {
        onError: () => Alert.alert('Envie non enregistrée', 'Vérifie ta connexion internet et réessaie.'),
      },
    );
  };

  return (
    <Animated.View style={popStyle}>
      <GlassIconButton
        icon={isSaved ? { ios: 'heart.fill', android: 'heart_check' } : { ios: 'heart', android: 'favorite' }}
        accessibilityLabel={isSaved ? 'Retirer de mes envies' : 'Ajouter à mes envies'}
        onPress={onPress}
        active={isSaved}
      />
    </Animated.View>
  );
}
