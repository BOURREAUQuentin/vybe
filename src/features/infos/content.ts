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
  'Vybe ne demande aucun compte et ne collecte aucune donnée personnelle : pas d’inscription, pas d’outil de mesure d’audience, pas de suivi des plantages.',
  'Localisation (facultative) : elle n’est demandée que si tu touches « Me localiser », pour te montrer les concerts proches. Ta position est approximative (arrondie à environ 1 km), utilisée uniquement pour cette recherche et jamais enregistrée, ni sur ton téléphone ni sur nos serveurs. Elle n’est jamais suivie en arrière-plan. Tu peux toujours choisir une ville à la place, et retirer l’autorisation dans les réglages de ton téléphone.',
  'Si tu choisis une ville pour « Près de chez toi », ce choix est gardé uniquement sur ton téléphone, pour le prochain lancement. Tu peux l’effacer à tout moment depuis « Modifier ».',
  'Pour afficher les concerts, l’application interroge une base de données hébergée par Supabase dans l’Union européenne. Comme pour toute connexion à internet, l’hébergeur peut traiter des données techniques (comme l’adresse IP) le temps nécessaire au fonctionnement du service.',
  'Le bouton « Billetterie » ouvre un site tiers, qui applique ses propres règles de confidentialité.',
  `Pour toute question : ${publisher.email}.`,
] as const;
