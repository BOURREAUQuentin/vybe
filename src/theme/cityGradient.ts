import { cityGradient } from '@/theme/tokens';

const FULL_TURN = 360;

/** Teinte stable (degrés) tirée du nom de la ville, hors de la zone du lime. */
export function cityHue(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0; // entier non signé 32 bits
  }
  const { from, to } = cityGradient.excludedHues;
  const hue = hash % (FULL_TURN - (to - from));
  return hue >= from ? hue + (to - from) : hue;
}

/** Fond d'une tuile de ville sans photo (`experimental_backgroundImage`). */
export function cityGradientFor(name: string): string {
  const hue = cityHue(name);
  const { angle, start, end, hueShift } = cityGradient;
  const endHue = (hue + hueShift) % FULL_TURN;
  return `linear-gradient(${angle}, hsl(${hue}, ${start.saturation}%, ${start.lightness}%), hsl(${endHue}, ${end.saturation}%, ${end.lightness}%))`;
}
