// Design tokens de Vybe — Direction A « Urbain & énergique ».
// Source unique des couleurs, polices, tailles et espacements : ne jamais coder ces valeurs en dur ailleurs.
// Règles d'usage : voir docs/design.md.

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
} as const;

// Noms à faire correspondre avec le chargement des polices (@expo-google-fonts).
export const fonts = {
  display: 'Anton_400Regular', // grands titres uniquement, jamais sous 22 pt
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  display: 32,
  hero: 48,
  initials: 72, // initiales d'une carte vedette sans photo
  initialsHero: 96, // initiales de l'en-tête de fiche artiste sans photo
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
  wide: 1, // petits titres de section en majuscules
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
} as const;

export const sizes = {
  heroHeight: 280, // en-tête photo de la fiche artiste
  avatar: 40, // vignette d'artiste dans une programmation
  avatarLarge: 64, // vignette d'artiste suivi (onglet Mes artistes)
  featuredWidth: 220, // carte vedette (format affiche)
  featuredHeight: 300,
  tabBarClearance: 64, // hauteur de la barre d'onglets iOS qui flotte au-dessus du contenu
  sheetHandleWidth: 36, // petite barre de prise en haut des panneaux de filtre
  sheetHandleHeight: 4,
  sheetMaxHeight: '75%', // hauteur maximale d'un panneau de filtre
} as const;

export const opacity = {
  pressed: 0.6, // retour visuel quand on appuie sur un bouton
  disabled: 0.5, // élément annulé ou désactivé
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
} as const;
export type Theme = typeof theme;
