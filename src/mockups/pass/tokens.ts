// Direction « PASS » : valeurs propres au prototype (dérivées de src/theme/tokens.ts).

export const pass = {
  size: {
    counter: 72, // compteur « 57 concerts à venir »
    stubDay: 34, // jour dans le talon du ticket
    passTitle: 40, // nom d'artiste sur le pass de la fiche
    cardTitle: 24, // nom d'artiste sur un pass du carrousel
    label: 10, // étiquettes de champ (« SALLE », « HEURE »)
    stamp: 11,
  },
  labelSpacing: 1.5,
  notch: 18, // diamètre des encoches du ticket
  dot: 3, // points de la ligne de perforation
  dots: 9, // nombre de points (perforation verticale)
  dotsHorizontal: 22, // nombre de points (perforation horizontale)
  stubWidth: 76,
  searchStubWidth: 52,
  stampTilt: '-6deg',
  stampInset: 2, // écart entre les deux filets du tampon
  barcodeHeight: 36,
  barcodeBars: 44,
  barcodeUnit: 1.5, // largeur d'une unité de barre
  cardWidth: 240,
  cardPhotoHeight: 170,
  detailPhotoHeight: 260,
  zoneMinWidth: '47%',
  shakeOffset: 4, // secousse du pass quand on le « tamponne »
  liftedScale: 0.98,
} as const;
