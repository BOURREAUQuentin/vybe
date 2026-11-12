# Vybe

Application mobile (iOS et Android) pour découvrir, suivre et garder en mémoire des concerts en France, avec le rap mis en avant.

Version : **V1.0 (MVP)** — périmètre dans `docs/mvp.md`. Les concerts affichés sont des **données de démonstration** (artistes et salles réels, concerts fictifs).

## Fonctionnalités (V1.0)

- **Découvrir** : Rap à l’affiche, Cette semaine, Par ville, Par genre, À venir (par mois).
- **Recherche** par artiste, concert, salle ou ville (insensible aux accents).
- **Fiche concert** : affiche, statut, date, lieu, prix indicatif, programmation, billetterie, source.
- **Fiche artiste** : photo ou initiales, description, concerts à venir.
- **Infos** : à propos, mentions légales, confidentialité.

Aucun compte, aucune donnée personnelle collectée.

## Stack

- Expo (SDK 58) + React Native, TypeScript strict, Expo Router.
- Supabase (PostgreSQL, région UE) : lecture seule depuis l’app, protégée par Row Level Security.
- TanStack Query pour les requêtes et le cache.

## Installation

Prérequis : Node.js 20 ou plus, l’app **Expo Go** sur le téléphone, et pour Android un émulateur (Android Studio).

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Créer le fichier `.env` à partir du modèle, puis le remplir avec l’URL du projet Supabase et la clé **publishable** (Supabase › Project Settings › API Keys) :
   ```bash
   cp .env.example .env
   ```
   Ne jamais y mettre la clé secrète, et ne jamais commiter `.env`.
3. Lancer le serveur de développement :
   ```bash
   npx expo start
   ```
   - iPhone : scanner le QR code avec l’appareil photo (ouvre Expo Go).
   - Android : démarrer l’émulateur dans Android Studio, puis appuyer sur `a`.

## Base de données (Supabase)

Le schéma est géré par migrations dans `supabase/migrations/`, les données de démonstration dans `supabase/seed.sql`.

Première fois sur un nouvel ordinateur (dans l’app Terminal de macOS, car ces commandes sont interactives) :

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
```

Commandes courantes :

| Commande | Rôle |
|---|---|
| `npx supabase migration new <nom>` | Crée une migration vide |
| `npx supabase db push --remote --dry-run` | Simule l’envoi des migrations |
| `npx supabase db push --remote` | Applique les migrations sur le projet hébergé |
| `npx supabase db push --remote --include-seed` | Réapplique aussi les données de démo (rafraîchit leurs dates, ne supprime rien) |
| `npx supabase gen types --lang typescript --remote --schema public > src/types/database.ts` | Régénère les types après une migration |

## Logo et icônes

Les logos sources sont dans `assets/brand/` (SVG). Après une modification, régénérer toutes les icônes et l’écran de démarrage :

```bash
npm run icons
```

L’icône et l’écran de démarrage ne s’affichent pas dans Expo Go (qui montre les siens) : il faut un build de l’app pour les voir sur le téléphone.

## Vérifications

```bash
npx tsc --noEmit   # types
npx expo lint      # style du code
```

## Documentation

- `CLAUDE.md` — règles du projet, conventions, commandes
- `docs/cahier-des-charges.md` — cahier des charges complet
- `docs/mvp.md` — périmètre et critères de fin du MVP
- `docs/design.md` — direction artistique
