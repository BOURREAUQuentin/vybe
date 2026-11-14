import { Image, StyleSheet, type ImageSourcePropType } from 'react-native';

// Texture générée une fois (bruit aléatoire, 160 × 160 px, très transparente).
const grain: ImageSourcePropType = require('./grain.png');

type GrainProps = {
  opacity: number;
};

// Texture de grain répétée par-dessus une zone (aspect papier imprimé). Ne capte pas le toucher.
export function Grain({ opacity }: GrainProps) {
  return (
    <Image
      source={grain}
      resizeMode="repeat"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[StyleSheet.absoluteFill, { opacity }]}
    />
  );
}
