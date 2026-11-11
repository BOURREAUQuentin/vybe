// Textes de la page Infos (à propos, mentions légales, confidentialité).
// Version minimale du MVP : à faire relire avant toute diffusion publique
// (cahier des charges, section 10.8).

export const publisher = {
  name: 'Quentin Bourreau',
  email: 'vybe.infos@gmail.com',
} as const;

export const host = {
  name: 'Supabase',
  url: 'https://supabase.com',
  region: 'Union européenne (Paris)',
} as const;

export const about = [
  'Vybe t’aide à découvrir les concerts en France, avec le rap mis en avant : les dates à venir, les artistes, les salles et la billetterie.',
  'Cette version est une démonstration. Les artistes et les salles sont réels, mais les concerts, dates, prix et statuts affichés sont fictifs. Les photos sont des images d’illustration et ne représentent pas les artistes.',
] as const;

export const legalNotice = [
  `Éditeur et directeur de la publication : ${publisher.name}, à titre personnel.`,
  `Contact : ${publisher.email}`,
  `Hébergement des données : ${host.name}, région ${host.region}.`,
] as const;

export const privacyPolicy = [
  'Vybe ne demande aucun compte et ne collecte aucune donnée personnelle : pas d’inscription, pas d’outil de mesure d’audience, pas de suivi des plantages, pas de géolocalisation.',
  'Pour afficher les concerts, l’application interroge une base de données hébergée par Supabase dans l’Union européenne. Comme pour toute connexion à internet, l’hébergeur peut traiter des données techniques (comme l’adresse IP) le temps nécessaire au fonctionnement du service.',
  'Le bouton « Billetterie » ouvre un site tiers, qui applique ses propres règles de confidentialité.',
  `Pour toute question : ${publisher.email}.`,
] as const;
