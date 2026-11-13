# Vybe

Application mobile (iOS et Android) pour découvrir, suivre et garder en mémoire des concerts en France, avec le rap mis en avant.

Version : **V1.3 (compte et favoris)** — périmètre dans `docs/v1.3.md` (V1.2 : `docs/v1.2.md`, V1.0 : `docs/mvp.md`). Les concerts affichés sont des **données de démonstration** (artistes et salles réels, concerts fictifs). La V1.1 (données réelles Ticketmaster) est faite plus tard.

## Fonctionnalités

Cinq onglets : **Découvrir**, **Recherche**, **Artistes**, **Envies**, **Profil**. Tout se consulte sans compte ; le compte sert à suivre, enregistrer et personnaliser.

- **Découvrir** : Rap à l’affiche, Près de chez toi, Cette semaine, Par ville, Par genre, À venir (par mois).
- **Concerts** : filtres combinables date, ville, rayon (10 à 100 km) et genres.
- **Près de chez toi** : « Me localiser » (facultatif), choix d’une ville, ou ville principale du compte.
- **Recherche** par artiste, concert, salle ou ville (insensible aux accents).
- **Fiches** concert (♡ envie, billetterie), artiste (Suivre), salle (Ajouter à mes salles, itinéraire).
- **Compte** (V1.3) : connexion sans mot de passe par code à 6 chiffres reçu par e-mail.
- **Artistes** (V1.3) : artistes suivis et leurs prochains concerts ; onboarding « Suis quelques artistes ».
- **Envies** (V1.3) : concerts enregistrés, à venir et déjà passés.
- **Profil** (V1.3) : villes favorites (dont une principale), salles favorites, genres préférés, **Exporter mes données**, **Supprimer mon compte**.
- **Infos** : à propos, mentions légales, politique de confidentialité.

## Confidentialité

Le compte est facultatif. Données traitées : e-mail, artistes suivis, envies, villes, salles et genres favoris — exportables et supprimées avec le compte. Aucun outil d’analyse ni de suivi des plantages. La localisation est **facultative**, approximative (~1 km) et jamais enregistrée. Détails : politique de confidentialité (page Infos) et registre des traitements (`docs/rgpd.md`).

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
| `npx supabase db query --remote --file supabase/seed.sql --yes` | (Ré)applique les données de démo : insère ou met à jour, rafraîchit leurs dates, ne supprime rien (`db push --include-seed` ne l’exécute qu’une fois) |
| `npx supabase gen types --lang typescript --remote --schema public > src/types/database.ts` | Régénère les types après une migration |
| `npx supabase db query --remote --file supabase/tests/user-data-rls.sql --yes` | Teste la sécurité des données des comptes (transaction toujours annulée) ; bilan « n/n réussis » |

## Configurer les e-mails de connexion (Supabase + Brevo)

Ces réglages vivent dans le tableau de bord Supabase, **pas dans le code** : à refaire sur tout nouveau projet Supabase.

1. **Brevo** (brevo.com) : déclarer l’expéditeur (Senders) et générer une **clé SMTP** (SMTP & API › SMTP). Ne jamais la mettre dans le code, `.env` ni Git.
2. **Supabase › Authentication › SMTP Settings** : activer le SMTP personnalisé — hôte `smtp-relay.brevo.com`, port `587`, identifiant SMTP Brevo (`…@smtp-brevo.com`), mot de passe = clé SMTP (`xsmtpsib-…`).
3. **Supabase › Authentication › Email Templates** : dans « Magic link » et « Confirm sign up », afficher le code avec `{{ .Token }}` (objet : « Ton code de connexion Vybe »).
4. **Email OTP Length** = 6 ; augmenter la limite d’e-mails par heure (Rate Limits).

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
