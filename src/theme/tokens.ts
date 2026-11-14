// Design tokens de Vybe — direction « Hybride » (V1.3.1) : l'identité du billet sur une structure claire.
// Source unique des couleurs, polices, tailles, espacements et mouvements : ne jamais coder ces valeurs
// en dur ailleurs. Règles d'usage : voir docs/design.md.

export const colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceRaised: '#242424',
  border: '#2E2E2E',
  accent: '#C6FF3D',
  onAccent: '#0A0A0A', // texte posé sur l'accent lime
  text: '#F5F5F0',
  textSecondary: '#A8A8A0',
  alert: '#FF6B5E',
  overlay: 'rgba(10, 10, 10, 0.85)', // dégradé sombre sur les photos d'artistes
  // Nuances dérivées de la palette (aucune nouvelle couleur principale).
  scrim: 'rgba(10, 10, 10, 0.55)', // voile sombre (dégradé photo, verre lisible sur photo claire)
  glass: 'rgba(26, 26, 26, 0.55)', // surface en verre sans flou (Android)
  hairline: 'rgba(245, 245, 240, 0.12)', // filet fin (bord du verre)
  hairlineStrong: 'rgba(245, 245, 240, 0.28)', // filet visible (grille d'infos du billet)
  stubMuted: 'rgba(245, 245, 240, 0.18)', // talon d'un billet passé
  accentGlow: 'rgba(198, 255, 61, 0.45)', // halo du bouton principal (Billetterie)
  transparent: 'transparent',
} as const;

// Dégradé du bas des photos (texte lisible par-dessus).
export const photoFade = `linear-gradient(to top, ${colors.background} 0%, ${colors.scrim} 40%, transparent 70%)`;

// Noms à faire correspondre avec le chargement des polices (@expo-google-fonts).
export const fonts = {
  display: 'Anton_400Regular', // grands titres uniquement, jamais sous 22 pt
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const fontSizes = {
  label: 10, // étiquettes en capitales espacées (« SALLE », jour du talon)
  chip: 11, // pastilles de statut et « ♥ Envie »
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  cardTitle: 26, // nom d'artiste sur une carte du carrousel (Anton)
  stubDay: 30, // jour dans le talon du billet (Anton)
  display: 32,
  screenTitle: 34, // titre d'écran (Inter gras), ex. « Recherche »
  detailTitle: 46, // nom d'artiste en tête de fiche (Anton)
  heroTitle: 56, // nom d'artiste du grand visuel de Découvrir (Anton)
  initials: 72, // initiales d'une carte vedette sans photo
  initialsGiant: 144, // initiales d'un grand visuel sans photo
} as const;

export const lineHeights = {
  // Titres Anton : hauteur naturelle de la police (≈ 1,5). En dessous, iOS coupe
  // le haut des majuscules accentuées (ex. le É de « DÉCOUVRIR »).
  display: 1.5,
  normal: 1.4, // texte courant Inter
} as const;

// Agrandissement maximal du texte (réglage « Taille du texte » du téléphone) :
// les grands titres Anton sont plafonnés pour ne pas déborder ; le texte courant reste libre.
export const maxFontScale = {
  display: 1.3,
} as const;

export const letterSpacing = {
  // Espacement normal, à préciser explicitement sur les champs de saisie : sur iOS, un champ
  // natif recyclé peut garder l'espacement d'un autre champ (ex. celui du code).
  none: 0,
  label: 1.5, // étiquettes du billet (« SALLE », « SAM »)
  code: 8, // chiffres d'un code de connexion
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 24,
  pill: 999,
} as const;

export const touch = {
  minSize: 44, // taille tactile minimale (points)
} as const;

export const iconSizes = {
  sm: 14, // flèche des pastilles de filtre
  md: 24,
  lg: 40,
  xl: 80, // icône de lieu d'une fiche salle sans photo
} as const;

export const sizes = {
  avatar: 40, // vignette d'artiste dans une programmation
  avatarLarge: 64, // vignette d'artiste suivi (onglet Mes artistes)
  tabBarClearance: 64, // hauteur de la barre d'onglets iOS qui flotte au-dessus du contenu
  sheetHandleWidth: 36, // petite barre de prise en haut des panneaux de filtre
  sheetHandleHeight: 4,
  sheetMaxHeight: '75%', // hauteur maximale d'un panneau de filtre
  // V1.3.1 (direction Hybride)
  avatarXL: 72, // line-up de la fiche concert, « Artistes à l'affiche »
  heroVisual: 540, // grand visuel de Découvrir
  detailHeader: 420, // photo en tête de fiche concert
  carouselCardWidth: 250,
  carouselCardHeight: 330,
  cityTileWidth: 150, // tuile « Villes » de Découvrir (défilement horizontal)
  cityTileHeight: 104,
  gridTileWidth: '48%', // tuile en grille de 2 colonnes (Recherche)
  wishBadge: 30, // rond « cœur » dans le coin d'une photo
  passSkeleton: 220,
  selectionRing: 3, // anneau blanc autour d'un artiste choisi (onboarding) // silhouette du pass pendant le chargement de la fiche concert
} as const;

export const opacity = {
  pressed: 0.6, // retour visuel quand on appuie sur un bouton
  disabled: 0.5, // élément annulé ou désactivé
  past: 0.6, // billet d'un concert passé
} as const;

// Billet (V1.3.1) : talon date, perforation, encoches, code-barres décoratif.
export const ticket = {
  stubWidth: 72,
  notch: 16, // diamètre des encoches
  dot: 3, // points de la perforation
  dots: 8, // perforation verticale
  dotsHorizontal: 24, // perforation horizontale
  outlineWidth: 1.5, // contour corail du talon « Reporté »
  barcodeHeight: 28,
  barcodeBars: 40,
  barcodeUnit: 1.5, // largeur d'une unité de barre
} as const;

// Verre dépoli (boutons et pastilles sur photo, barre du haut).
export const glass = {
  blurIntensity: 50,
  borderWidth: 1,
  glowRadius: 24, // halo du bouton Billetterie
} as const;

// Mouvement : court et sec. Tout est désactivé si « Réduire les animations » est activé.
export const motion = {
  pressedScale: 0.97, // carte enfoncée sous le doigt
  spring: { damping: 18, stiffness: 240 },
  enterMs: 240, // apparition d'un bloc
  likeMs: 160, // « pop » du cœur (aller-retour)
  heartBump: 1.15,
  imageZoomFrom: 1.06, // la photo d'une fiche se pose en arrivant
  imageZoomMs: 420,
  parallax: 0.45, // la photo défile moins vite que le contenu
  stretchMax: 1.4, // étirement de la photo quand on tire vers le bas
  carouselInactiveScale: 0.92,
  carouselInactiveOpacity: 0.6,
  headerFadeStart: 240, // défilement à partir duquel la barre en verre apparaît
  headerFadeLength: 80,
} as const;

export type EventStatus =
  | 'announced'
  | 'on_sale'
  | 'sold_out'
  | 'postponed'
  | 'cancelled'
  | 'past';

type BadgeStyle = {
  label: string;
  background: string;
  text: string;
  border: string;
};

// Styles des badges de statut. Seul « Billetterie ouverte » utilise le lime.
export const statusBadges: Record<EventStatus, BadgeStyle> = {
  announced: { label: 'Annoncé', background: colors.surface, text: colors.text, border: colors.border },
  on_sale: { label: 'Billetterie ouverte', background: colors.accent, text: colors.onAccent, border: colors.accent },
  sold_out: { label: 'Complet', background: colors.surface, text: colors.text, border: colors.border },
  postponed: { label: 'Reporté', background: 'transparent', text: colors.textSecondary, border: colors.textSecondary },
  cancelled: { label: 'Annulé', background: 'transparent', text: colors.alert, border: colors.alert },
  past: { label: 'Passé', background: colors.surface, text: colors.textSecondary, border: colors.border },
};

// Statuts sur les billets (V1.3.1, version « G ») : seuls les statuts hors normale sont signalés.
// « Annoncé » et « Billetterie ouverte » n'ont ni pastille ni talon coloré : la billetterie est dite
// sur la fiche, par le bouton lime. Les statuts n'utilisent jamais le lime.
type StatusLook = {
  /** Texte court de la pastille. */
  chip: string;
  chipStyle: { fill: string; border: string; text: string; strike?: boolean };
  /** Talon du billet : plein (fill) ou contour (outline) jusqu'à la perforation. */
  stub?: { fill?: string; outline?: string; text: string };
  /** Opacité du billet entier (passé, annulé). */
  ticketOpacity?: number;
};

export const statusLooks: Partial<Record<EventStatus, StatusLook>> = {
  sold_out: {
    chip: 'COMPLET',
    chipStyle: { fill: colors.alert, border: colors.alert, text: colors.background },
    stub: { fill: colors.alert, text: colors.background },
  },
  postponed: {
    chip: 'REPORTÉ',
    chipStyle: { fill: colors.background, border: colors.alert, text: colors.alert },
    stub: { outline: colors.alert, text: colors.alert },
  },
  past: {
    chip: 'PASSÉ',
    chipStyle: { fill: colors.border, border: colors.border, text: colors.textSecondary },
    stub: { fill: colors.stubMuted, text: colors.text },
    ticketOpacity: opacity.past,
  },
  cancelled: {
    chip: 'ANNULÉ',
    chipStyle: { fill: colors.background, border: colors.alert, text: colors.alert, strike: true },
    ticketOpacity: opacity.disabled,
  },
};

export const theme = {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  maxFontScale,
  letterSpacing,
  spacing,
  radius,
  touch,
  iconSizes,
  sizes,
  opacity,
  statusBadges,
  ticket,
  glass,
  motion,
  statusLooks,
} as const;
export type Theme = typeof theme;
