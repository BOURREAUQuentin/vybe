# Vybe — Direction artistique

Direction retenue : **Direction A « Urbain & énergique »**. Rap en avant, contrastes forts, lime acide sur noir profond, esprit affiche de rue et file d’attente de salle.

Les maquettes existantes illustrent uniquement la charte (couleurs, typographie, ambiance). Elles ne définissent ni les écrans ni les fonctionnalités : le périmètre est fixé par `docs/mvp.md`.

Toutes les valeurs ci-dessous sont dans `src/theme/tokens.ts`. Ne jamais les recopier en dur dans un composant.

## Palette

| Rôle | Couleur | Usage |
|---|---|---|
| Fond | `#0A0A0A` | Arrière-plan principal |
| Surface | `#1A1A1A` | Cartes, champs, barres |
| Accent lime | `#C6FF3D` | Action principale, mise en avant |
| Texte | `#F5F5F0` | Texte principal |
| Secondaire | `#A8A8A0` | Texte secondaire, métadonnées |
| Alerte | `#FF6B5E` | Annulé, erreurs |

## Typographie

- **Anton** : uniquement pour les grands titres (titre d’écran, nom d’artiste dans une carte vedette ou un en-tête de fiche). Jamais en dessous de 22 points.
- **Inter** : tout le reste (texte courant, boutons, badges, métadonnées).
- Titres Anton en majuscules.

## Règles d’affinage (à appliquer)

1. **Lime avec parcimonie.** Une seule action ou mise en avant lime par écran (ex. le bouton « Billetterie »). Les badges secondaires et les cartes de liste restent en surface sombre. Le lime doit guider l’œil, pas se disputer l’attention.
2. **Photos d’artistes dans les cartes vedettes.** Quand une photo existe, l’afficher en fond avec un dégradé sombre du bas vers le haut, texte par-dessus. Sans photo : fond surface et initiales de l’artiste en Anton, couleur lime.
3. **Lisibilité d’Anton.** Réservé aux grands titres ; vérifier la lisibilité sur petit écran avant de valider un écran.

## Composants de base

- **Bouton principal** : fond lime, texte noir Inter gras. Un seul par écran.
- **Bouton secondaire** : contour clair, fond transparent, texte clair.
- **Badges de statut** :
  - Billetterie ouverte : fond lime, texte noir (seul badge lime autorisé).
  - Annoncé : fond surface, texte clair.
  - Complet : fond surface, texte clair.
  - Reporté : contour secondaire, texte secondaire.
  - Annulé : contour alerte, texte alerte ; la carte entière passe à 50 % d’opacité.
- **Carte de concert (liste)** : fond surface, bloc date à gauche (jour en Anton, mois en Inter lime), nom de l’artiste, salle et ville en secondaire, badge de statut à droite.
- **Mention de source** : petite, en texte secondaire, sur la fiche concert (« Données de démonstration » au MVP, « Source : Ticketmaster » à partir de la V1.1).

## Principes d’expérience

- Thème sombre uniquement au MVP.
- États chargement (squelettes), vide (message + suggestion) et erreur (message + bouton « Réessayer ») sur chaque écran.
- Données manquantes gérées proprement : pas de champ vide affiché, pas de « null ».
- Respect des conventions iOS et Android (zones sûres, retour arrière, tailles tactiles d’au moins 44 points).

## Identité

Nom : **Vybe**.

- **Logo / icône** : « V égaliseur » — un V lime dont la branche droite est découpée en bandes verticales (évoque le son et le live), sur fond `#0A0A0A`. Source : `assets/brand/logo-mark.svg`.
- **Mot-symbole** : « VYBE » en Anton lime, utilisé sur l’écran de démarrage. Source : `assets/brand/wordmark.svg`.
- Les PNG (icône iOS, icône adaptative et monochrome Android, écran de démarrage, favicon) sont générés par `npm run icons` : ne pas les retoucher à la main, modifier les SVG puis relancer la commande.
- L’icône principale n’a pas de canal de transparence (exigence de l’App Store) ; le logo Android tient dans la zone sûre (cercle central de 66/108).
