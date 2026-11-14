// Direction « AFFICHE » : valeurs propres au prototype (dérivées de src/theme/tokens.ts).

export const affiche = {
  size: {
    mega: 104, // nom d'artiste en tête de fiche
    poster: 72, // titre d'écran, affiche principale de Découvrir
    big: 44, // affiche secondaire, gros jour du programme
    city: 34, // nuage de villes
    marquee: 28, // texte des bandeaux
    lineupMain: 40,
    lineupOther: 26,
    caps: 11, // petites capitales espacées (métadonnées)
    input: 24,
    heroInitials: 160, // initiales géantes sans photo
  },
  // Chevauchement des lignes d'un titre empilé (fraction de la taille) : chaque ligne garde la
  // hauteur naturelle d'Anton (pas de coupe des accents sur iOS) et remonte sur la précédente.
  stackOverlap: 0.36,
  capsSpacing: 2,
  stickerTilt: '-4deg',
  stickerTiltAlt: '3deg',
  tapeTilt: '-2deg',
  grainOpacity: 0.09,
  marqueeSpeed: 34, // points par seconde
  heroHeight: 540,
  heroPressedScale: 0.985, // grande surface : enfoncement plus discret
  posterWidth: 200,
  posterHeight: 280,
  detailPosterHeight: 560,
  stickerBorder: 2,
  inputBorder: 2,
  rowDayWidth: 52, // colonne du gros jour (« 21 »)
  rowStickerMaxWidth: 110,
  tapeOverflow: -24, // le bandeau « scotch » dépasse des bords de l'écran
} as const;
