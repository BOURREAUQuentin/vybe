// Direction « FLOW » : valeurs propres au prototype (dérivées de src/theme/tokens.ts).

export const flow = {
  size: {
    hero: 60, // nom d'artiste du hero de Découvrir
    detailTitle: 48,
    cardTitle: 26,
    largeTitle: 34, // titre d'écran façon iOS (Inter gras)
    section: 22,
    browseTile: 20,
    heroInitials: 144, // initiales du hero sans photo
  },
  heroHeight: 560,
  detailHeaderHeight: 440,
  parallax: 0.45, // la photo défile moins vite que le contenu
  stretchMax: 1.4, // étirement maximal de la photo quand on tire vers le bas
  cardWidth: 260,
  cardHeight: 340,
  carouselInactiveScale: 0.9,
  carouselInactiveOpacity: 0.55,
  thumb: 64,
  lineupAvatar: 72,
  blurIntensity: 50,
  headerFadeStart: 260, // défilement à partir duquel la barre en verre apparaît
  headerFadeLength: 80,
  glassBorder: 1,
  heartBump: 1.3, // rebond du cœur
  imageZoomFrom: 1.12, // la photo de la fiche « se pose » en arrivant
  imageZoomMs: 700,
  tileHeight: 110,
  tileWidth: '48%', // deux tuiles par ligne
  glowRadius: 28,
} as const;
