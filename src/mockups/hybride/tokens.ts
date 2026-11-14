// Direction « HYBRIDE » (Pass + Flow) : valeurs propres au prototype (dérivées de src/theme/tokens.ts).
// Dossier autonome : il ne dépend ni de pass/ ni de flow/, qui pourront être supprimés.

export const hybride = {
  size: {
    hero: 56, // nom d'artiste du hero de Découvrir
    detailTitle: 46,
    cardTitle: 26,
    largeTitle: 34, // titre d'écran (Inter gras)
    section: 22,
    stubDay: 30, // jour dans le talon du ticket
    label: 10, // étiquettes de champ (« SALLE »)
    stamp: 11,
    tile: 18,
    heroInitials: 144,
  },
  labelSpacing: 1.5,
  // Ticket
  notch: 16,
  dot: 3,
  dots: 8,
  dotsHorizontal: 24,
  stubWidth: 72,
  stampTilt: '-5deg',
  stampInset: 2,
  outlineWidth: 1.5, // contour corail du talon « Reporté »
  pastOpacity: 0.6, // billet d'un concert passé
  barcodeHeight: 28,
  barcodeBars: 40,
  barcodeUnit: 1.5,
  // Photos et carrousel
  heroHeight: 540,
  detailHeaderHeight: 420,
  parallax: 0.45,
  stretchMax: 1.4,
  cardWidth: 250,
  cardHeight: 330,
  carouselInactiveScale: 0.92,
  carouselInactiveOpacity: 0.6,
  avatar: 72, // line-up et artistes à l'affiche
  wishBadge: 30, // rond « cœur » dans le coin d'une photo (décoratif, non touchable)
  thumbTileWidth: 150,
  tileHeight: 104,
  tileWidth: '48%',
  // Verre
  blurIntensity: 50,
  glassBorder: 1,
  headerFadeStart: 240,
  headerFadeLength: 80,
  // Mouvement : plus court et plus sec que les premières maquettes.
  enterMs: 240,
  imageZoomFrom: 1.06,
  imageZoomMs: 420,
  heartBump: 1.15,
  likeMs: 160, // durée totale de l'animation « envie » (cœur + pastille)
  glowRadius: 24,
  topArtists: 8, // « Artistes à l'affiche » de la Recherche
  topCities: 6, // « Parcourir les villes » (2 colonnes × 3)
} as const;
