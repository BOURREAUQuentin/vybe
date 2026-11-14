// Textes de la page Infos (à propos, mentions légales, confidentialité).
// V1.3 : politique de confidentialité couvrant les comptes. À faire relire par un juriste
// avant toute diffusion publique (cahier des charges, 10.8 ; points listés dans docs/rgpd.md).

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
  'Les concerts viennent de Ticketmaster (Discovery API) et sont mis à jour chaque nuit. Les dates, salles et statuts peuvent changer : vérifie toujours sur la billetterie officielle avant d’acheter. Vybe n’est pas affilié à Ticketmaster et ne vend aucun billet.',
  'Les photos des concerts et des artistes sont fournies par Ticketmaster ; celles des villes viennent de Wikimedia Commons (voir « Crédits photos »).',
] as const;

export const legalNotice = [
  `Éditeur et directeur de la publication : ${publisher.name}, à titre personnel.`,
  `Contact : ${publisher.email}`,
  `Hébergement des données : ${host.name}, région ${host.region}.`,
  'Envoi des e-mails de connexion : Brevo.',
  'Données des concerts : Ticketmaster (Discovery API), sous ses conditions d’utilisation. Les noms, marques et images restent la propriété de leurs titulaires.',
] as const;

export type PolicySection = { title: string; paragraphs: readonly string[] };

export const privacyPolicy: readonly PolicySection[] = [
  {
    title: 'En bref',
    paragraphs: [
      'Vybe se consulte sans compte. Le compte est facultatif : il sert uniquement à suivre des artistes, enregistrer tes envies et garder tes favoris. Pas de publicité, pas de revente de données, pas d’outil de mesure d’audience ni de suivi des plantages.',
    ],
  },
  {
    title: 'Responsable',
    paragraphs: [`${publisher.name}, à titre personnel. Contact : ${publisher.email}.`],
  },
  {
    title: 'Données traitées',
    paragraphs: [
      'Si tu crées un compte : ton adresse e-mail, et les choix que tu fais dans l’application (artistes suivis, concerts enregistrés dans tes envies, villes et salles favorites, genres préférés).',
      'Localisation (facultative, avec ou sans compte) : demandée seulement si tu touches « Me localiser ». Ta position est approximative (arrondie à environ 1 km), utilisée uniquement pour cette recherche et jamais enregistrée, ni sur ton téléphone ni sur nos serveurs. Elle n’est jamais suivie en arrière-plan.',
      'Données techniques : comme pour toute connexion à internet, nos hébergeurs traitent des informations techniques (par exemple ton adresse IP) le temps nécessaire au fonctionnement et à la sécurité du service.',
    ],
  },
  {
    title: 'Pourquoi',
    paragraphs: [
      'Faire fonctionner ton compte et les fonctions que tu utilises (suivi d’artistes, envies, favoris, « Près de chez toi ») : c’est nécessaire au service que tu demandes.',
      'Assurer la sécurité du service (connexion, prévention des abus) : intérêt légitime.',
      'Te montrer les concerts proches : uniquement à ta demande, quand tu touches « Me localiser ».',
    ],
  },
  {
    title: 'Qui y a accès',
    paragraphs: [
      'Personne d’autre que toi et l’éditeur. Deux prestataires techniques interviennent pour faire fonctionner Vybe :',
      'Supabase : hébergement de la base de données et des comptes. Ses données sont stockées dans l’Union européenne (région Paris) ; la société a son siège aux États-Unis.',
      'Brevo (société française) : envoi des e-mails contenant ton code de connexion. Il reçoit ton adresse e-mail pour cela.',
      'Les concerts viennent de Ticketmaster, mais l’application ne lui transmet aucune donnée : c’est notre serveur qui récupère le catalogue, sans rien savoir de toi.',
      'Le bouton « Billetterie officielle » ouvre le site du vendeur de billets (le plus souvent Ticketmaster), qui applique ses propres règles de confidentialité.',
    ],
  },
  {
    title: 'Combien de temps',
    paragraphs: [
      'Tes données de compte sont conservées tant que ton compte existe. Quand tu le supprimes, elles sont effacées immédiatement et définitivement.',
      'Le code de connexion reçu par e-mail n’est valable que peu de temps (1 heure au plus).',
    ],
  },
  {
    title: 'Sur ton téléphone',
    paragraphs: [
      'L’application garde sur ton téléphone : ta session de connexion (effacée à la déconnexion), la ville choisie pour « Près de chez toi » (effaçable depuis « Modifier ») et un indicateur pour ne pas te reproposer « Suis quelques artistes ». Tout disparaît si tu désinstalles l’application.',
    ],
  },
  {
    title: 'Tes droits',
    paragraphs: [
      'Accès et portabilité : Profil › Mes données › « Exporter mes données ».',
      'Rectification : modifie tes choix directement dans l’application (Profil, fiches artiste, concert et salle).',
      'Effacement : Profil › Mes données › « Supprimer mon compte ».',
      `Opposition, limitation ou toute autre question : écris à ${publisher.email}. Réponse sous un mois.`,
      'Tu peux aussi adresser une réclamation à la CNIL (cnil.fr).',
    ],
  },
];
