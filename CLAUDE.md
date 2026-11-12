# CLAUDE.md — Vybe

Ce fichier est lu au début de chaque session. Il décrit le projet, la stack et les règles à respecter.

## Le projet

Vybe est une application mobile iOS et Android pour découvrir, suivre et garder en mémoire des concerts en France, avec le rap mis en avant.

- Cahier des charges complet : `docs/cahier-des-charges.md` (le périmètre de chaque version est en section 12).
- Version en cours : **V1.0 (MVP)**. Son périmètre exact est dans `docs/mvp.md`.
- Direction artistique : `docs/design.md`. Valeurs de design : `src/theme/tokens.ts`.

## Le porteur du projet

- Il est en école d'ingénieur en développement logiciel. Explique en français et simplement ce que tu fais et pourquoi, surtout pour les commandes du terminal et les choix d’architecture.
- Il travaille sur macOS et teste sur son iPhone (Expo Go) et sur un émulateur Android (Android Studio).
- Quand il doit agir lui-même (créer un compte, copier une clé, lancer une commande sur son téléphone), donne des étapes numérotées et précises.

## Règles absolues

1. **Ne développe que le périmètre de la version en cours** (`docs/mvp.md`). Si une demande en sort, signale-le avant d’agir.
2. **L’application lit uniquement la base Supabase.** Elle n’appelle jamais d’API externe (Ticketmaster ou autre). Seul le backend (fonctions Supabase, tâches planifiées) appelle les sources externes, à partir de la V1.1.
3. **Aucun secret dans le code ni dans Git.** Les variables d’environnement vont dans `.env` (ignoré par Git), avec un `.env.example` à jour. L’application ne contient que l’URL Supabase et la clé publique (anon / publishable), jamais la clé `service_role`.
4. **Row Level Security activée sur toutes les tables.** Au MVP, lecture publique seule sur le catalogue ; aucune écriture depuis l’application.
5. **TypeScript strict partout.** Pas de `any`, pas de `@ts-ignore` sans commentaire qui explique pourquoi.
6. **Aucune couleur, taille de police ou espacement codé en dur** : tout passe par `src/theme/tokens.ts`.
7. **Aucune donnée personnelle collectée au MVP** : pas d’outil d’analyse, de suivi des plantages ni de géolocalisation sans validation préalable.
8. Ne jamais supprimer de données, de migrations ou de fichiers du projet sans confirmation.

## Stack

- Expo (SDK stable récent) + React Native, en TypeScript.
- Navigation : Expo Router (navigation par fichiers).
- Données : client `@supabase/supabase-js` ; requêtes et états de chargement/erreur avec TanStack Query.
- Polices : Anton et Inter via `@expo-google-fonts`.
- Backend : Supabase (PostgreSQL), projet hébergé en Union européenne. Schéma géré par migrations avec la CLI Supabase.
- Avant d’ajouter une nouvelle dépendance, explique pourquoi et demande validation.

## Structure des dossiers

```
src/app/              Écrans et navigation (Expo Router) — uniquement des routes
src/components/       Composants réutilisables (cartes, badges, boutons, états vides…)
src/features/         Logique par domaine (events, artists, search…)
src/lib/              Client Supabase, utilitaires (dates, formatage)
src/theme/            tokens.ts et helpers de style
src/types/            Types partagés, dont les types générés depuis Supabase
supabase/migrations/  Migrations SQL
supabase/seed.sql     Données factices du MVP
docs/                 Cahier des charges, périmètre MVP, design
```

Navigation : les onglets Découvrir et Recherche partagent la pile `src/app/(discover,search)/` (fiches concert, artiste, ville, genre, Infos). Le layout racine fixe `unstable_settings.anchor = '(discover)'` et la pile partagée fixe l’écran d’accueil de chaque groupe : sans ces réglages, Expo Router ouvre le mauvais onglet ou le mauvais écran.

Le gabarit Expo (SDK 58) place les routes dans `src/app/`. Imports via l’alias `@/` (= `src/`), ex. `import { colors } from '@/theme/tokens'`. Fichiers de configuration (`app.json`, `package.json`, `tsconfig.json`) et `assets/` à la racine.

## Base de données

Conçue dès le MVP pour les versions suivantes. Elle doit prévoir :

- tables séparées pour les artistes, salles, villes et événements ;
- sur chaque événement, artiste et salle : un champ `source` (ex. `demo`, `ticketmaster`, `user`) et un champ `external_id` (identifiant chez la source, unique par source) ;
- un type d’événement (`concert`, `festival`) même si seuls les concerts sont affichés avant la V2.3 ;
- une table de liaison événement–artistes avec un rôle (`headliner`, `support`, `guest`, `co_headliner`) ;
- un statut d’événement (`announced`, `on_sale`, `sold_out`, `postponed`, `cancelled`, `past`) ;
- la possibilité d’événements créés par un utilisateur, non reliés à une source (V1.5) ;
- un champ de lien billetterie et des champs de prix facultatifs ;
- une future table unique `user_events` (statut `wishlist`, `going`, `attended`) prévue pour la V1.3, à ne pas créer au MVP.

Recherche (migration `search`) : fonctions `search_artists`, `search_cities`, `search_events`, insensibles à la casse et aux accents (`unaccent`), en `security invoker` (la RLS s’applique). L’app les appelle avec `supabase.rpc(...)`.

Conventions : noms en anglais et en `snake_case`, clés primaires `uuid`, colonnes `created_at` et `updated_at`, dates en `timestamptz`. Les données factices du MVP sont fictives mais réalistes et calquées sur les champs documentés de la Discovery API de Ticketmaster.

## Conventions de code

- Code, noms de variables et de fichiers en anglais. Commentaires et textes de l’interface en français.
- Composants fonctionnels, exports nommés, un composant par fichier. Composants en `PascalCase.tsx`, autres fichiers en `camelCase.ts`.
- Dates affichées au format français, fuseau `Europe/Paris` (ex. « sam. 21 mars · 20h00 »). Toujours passer par `src/lib/dates.ts` ; ne pas utiliser `Intl.DateTimeFormat#formatToParts` ni `toLocaleString` dans l’app : sur iPhone (Hermes), le rendu est incorrect (morceaux manquants, « 30h » au lieu de « 20h30 »).
- Chaque écran gère ses états : chargement, vide, erreur, et données manquantes (photo, prix, description absents).
- Accessibilité : libellés sur les boutons-icônes, zones tactiles d’au moins 44 × 44 points.

## Design

Respecter `docs/design.md`. En résumé : thème sombre, accent lime **utilisé avec parcimonie** (une seule action principale mise en avant par écran), Anton réservé aux grands titres, Inter pour tout le reste.

## Méthode de travail

- Pour toute fonctionnalité de plus de quelques fichiers : proposer d’abord un plan court, attendre la validation, puis avancer par petites étapes.
- Après chaque étape : lancer `npx tsc --noEmit` et `npx expo lint`, corriger les erreurs, puis résumer ce qui a changé et comment le tester sur le téléphone.
- Proposer un commit Git après chaque étape qui fonctionne, avec un message clair en français (ex. « Ajoute la fiche concert »).
- Ne jamais commiter `.env` ni de clé.

## Commandes utiles

- `npx expo start` : lance le serveur de développement (scanner le QR code avec l’appareil photo de l’iPhone).
- `npx tsc --noEmit` : vérifie les types.
- `npx expo lint` : vérifie le style du code.
- `npx supabase migration new <nom>` : crée un fichier de migration vide dans `supabase/migrations/`.
- `npx supabase db push --remote` : applique les migrations sur le projet Supabase hébergé (CLI v3 : sans `--remote`, elle vise une base locale Docker). Ajouter `--dry-run` pour simuler, `--include-seed` pour réappliquer `supabase/seed.sql` (rafraîchit les dates des données de démo, sans rien supprimer).
- `npx supabase gen types --lang typescript --remote --schema public > src/types/database.ts` : régénère les types après chaque migration.
- `npm run icons` : régénère icônes et écran de démarrage depuis `assets/brand/*.svg` (ne pas retoucher les PNG à la main).
- `supabase login` et `supabase link` demandent un vrai terminal : les lancer dans l’app Terminal de macOS, pas avec `!` dans Claude Code.

## Définition de « terminé »

Une version est terminée quand : toutes ses fonctionnalités sont testées sur iPhone et sur Android ; les états vides, chargements et erreurs sont gérés ; aucun plantage n’est constaté ; le code est sur GitHub avec un tag de version ; ce fichier et la documentation sont à jour ; le critère « Terminé quand » de la version (voir `docs/mvp.md`) est atteint.
