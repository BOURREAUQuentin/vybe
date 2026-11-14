// Valeurs de mouvement communes aux prototypes (étape 2 de la refonte).
// Elles rejoindront src/theme/tokens.ts pour la direction retenue.

export const motion = {
  pressedScale: 0.97, // carte enfoncée sous le doigt
  spring: { damping: 18, stiffness: 240 }, // ressort court, sans rebond exagéré
  bounce: { damping: 9, stiffness: 260 }, // petit rebond (sticker, tampon, cœur)
  fadeMs: 260,
} as const;

// Nuances dérivées de la palette (aucune nouvelle couleur principale).
export const derived = {
  hairline: 'rgba(245, 245, 240, 0.12)', // filet fin : texte à 12 %
  hairlineStrong: 'rgba(245, 245, 240, 0.28)',
  accentGlow: 'rgba(198, 255, 61, 0.45)', // halo lime (bouton principal)
  accentSoft: 'rgba(198, 255, 61, 0.14)',
  glass: 'rgba(26, 26, 26, 0.55)', // surface en verre (repli Android du flou)
  scrim: 'rgba(10, 10, 10, 0.55)',
  stubMuted: 'rgba(245, 245, 240, 0.18)', // talon d'un concert passé (version G)
  transparent: 'transparent',
} as const;
