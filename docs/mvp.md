# Vybe — Périmètre du MVP (V1.0)

Référence : section 12.1 du cahier des charges (`docs/cahier-des-charges.md`).

## Objectif

Disposer d’une base saine (architecture, structure de base de données, interfaces de base) qui fonctionne de bout en bout avec des données factices, avant de brancher Ticketmaster en V1.1.

## Fonctionnalités incluses

- Accès libre, sans inscription ni connexion.
- **Page Découvrir** organisée en sections, sans réglage utilisateur. Par exemple : « Rap à l’affiche » (mise en avant du positionnement), « Cette semaine », « Par ville », « Par genre ». Concerts triés par date.
- **Recherche** par artiste, concert ou ville.
- **Fiche artiste** : nom, photo si disponible, courte description si disponible, concerts à venir.
- **Fiche concert** : artiste(s) avec leur rôle, date, heure, salle, ville, prix indicatif s’il est renseigné, statut, bouton vers la billetterie et mention de la source. Le lien et la source viennent de la base (au MVP : lien factice et mention « Données de démonstration »).
- **Page Infos** : à propos, mentions légales, politique de confidentialité (textes minimaux).
- Concerts uniquement : aucun festival affiché.

## Navigation

Deux onglets : **Découvrir** et **Recherche**. La page **Infos** est accessible depuis Découvrir (icône en haut d’écran). Fiches artiste et concert ouvertes depuis les listes.

## Données et technique

- Données factices écrites dans Supabase par `supabase/seed.sql` : au moins 15 artistes (majorité rap, quelques autres genres), 10 salles dans au moins 5 villes, 40 concerts répartis sur les 3 prochains mois, avec quelques premières parties et tous les statuts représentés.
- Noms d’artistes et de salles inventés (pas d’artistes réels).
- Champs calqués sur la Discovery API de Ticketmaster pour faciliter la V1.1.
- L’application lit uniquement Supabase ; aucun appel à une API externe.
- Schéma pensé pour les versions suivantes (voir `CLAUDE.md`, section Base de données).
- Back-office : tableau de bord Supabase.

## Hors périmètre (ne pas développer)

Comptes et connexion, suivi d’artistes, liste d’envies, notifications, filtres avancés, géolocalisation, fiche salle, festivals, historique, intégration Ticketmaster.

## Terminé quand

- L’application affiche les données factices sur iPhone et sur Android.
- La navigation entre Découvrir, Recherche, fiche artiste, fiche concert et page Infos est complète.
- Les états chargement, vide et erreur sont visibles et soignés sur chaque écran.
- Le schéma de base de données couvre les besoins listés dans `CLAUDE.md`.
- Le code est sur GitHub avec le tag `v1.0`.

## Ordre de développement suggéré

1. Initialiser le projet Expo (TypeScript, Expo Router), installer les polices et brancher `src/theme/tokens.ts`.
2. Mettre en place la navigation à deux onglets avec des écrans vides.
3. Créer le projet Supabase, le schéma (migrations) et les données factices.
4. Connecter l’application à Supabase et afficher une première liste de concerts.
5. Construire la fiche concert puis la fiche artiste.
6. Construire la page Découvrir et ses sections.
7. Construire la recherche.
8. Page Infos, états vides et erreurs, finitions, tests iPhone et Android.
