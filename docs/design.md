# Vybe — Direction artistique

Direction retenue (V1.3.1) : **« Hybride »** — l’identité du **billet de concert** posée sur une structure claire et ergonomique, façon app de streaming. Rap en avant, contrastes forts, lime acide sur noir profond. Historique du choix : `docs/v1.3.1.md`.

Toutes les valeurs ci-dessous sont dans `src/theme/tokens.ts`. Ne jamais les recopier en dur dans un composant.

## Palette

| Rôle | Couleur | Usage |
|---|---|---|
| Fond | `#0A0A0A` | Arrière-plan principal, encoches des billets |
| Surface | `#1A1A1A` | Billets, cartes, champs |
| Surface relevée | `#242424` | Appui, vignettes sans photo |
| Accent lime | `#C6FF3D` | **Action principale uniquement** |
| Texte | `#F5F5F0` | Texte principal, pastille « ♥ Envie » |
| Secondaire | `#A8A8A0` | Métadonnées, étiquettes |
| Alerte (corail) | `#FF6B5E` | Statuts Complet, Reporté, Annulé ; erreurs |

**Nuances dérivées** (pas de nouvelle couleur principale) : voile sombre `scrim` (dégradé photo, verre lisible sur photo claire), `glass` (verre sans flou, Android), filets `hairline` / `hairlineStrong`, `stubMuted` (talon d’un billet passé), `accentGlow` (halo du bouton Billetterie).

## Typographie

- **Anton** (majuscules) : grands titres seulement — nom d’artiste du grand visuel (56 pt), en tête de fiche (46 pt), sur une carte du carrousel (26 pt), et le **jour du talon** du billet (30 pt). Jamais en dessous de 22 pt. Hauteur de ligne naturelle (×1,5) pour ne pas couper les accents sur iOS.
- **Inter** : tout le reste. Titres d’écran en Inter gras 34 pt (« Recherche »), titres de section en Inter gras 22 pt, texte courant 16 pt.
- **Étiquettes de billet** : Inter demi-gras 10 pt, capitales espacées (« SALLE », « SAM », « NOV »).
- Chiffres (heure, numéro, compteurs) en **chiffres tabulaires**.

## Règles

1. **Lime avec parcimonie.** Une seule mise en avant lime par écran : l’action principale (Billetterie, Se connecter…). Les statuts, pastilles, filtres et cœurs ne sont **jamais** lime.
2. **On ne signale que ce qui sort de la normale.** Un concert annoncé ou en vente n’a ni pastille ni talon coloré ; la billetterie est dite sur la fiche, par le bouton lime.
3. **Photos d’artistes.** En fond avec un dégradé sombre vers le bas, texte par-dessus. Sans photo : fond surface et initiales en Anton lime (seul autre usage toléré du lime, purement graphique).
4. **Tout ce qui est posé sur une photo reste lisible** sur une image claire : pastilles à fond opaque, boutons en verre avec voile sombre.
5. **Mouvement court et sec**, jamais décoratif en boucle ; tout est coupé si « Réduire les animations » est activé.

## Le billet (composant signature)

Toutes les listes de concerts utilisent le billet (`Ticket`) :

- **Talon** à gauche (72 pt) : jour de la semaine, **jour en Anton**, mois ; puis une **ligne de perforation** verticale avec deux **encoches** (demi-cercles découpés en haut et en bas).
- **Corps** : artiste(s) en Inter gras, « avec … » (premières parties) ou une ligne mise en avant (recherche d’une première partie), salle · ville, puis le pied : **heure**, pastille **« ♥ Envie »** si le concert est enregistré, pastille de **statut** s’il sort de la normale.
- Appui : le billet s’enfonce légèrement (échelle 0,97) + petit retour haptique.

### Statuts (version « G »)

| Statut | Talon | Pastille | Billet |
|---|---|---|---|
| Annoncé, Billetterie ouverte | sombre (normal) | aucune | normal |
| **Complet** | corail plein jusqu’à la perforation, découpé par les encoches (les points le « trouent ») | « COMPLET » corail plein | normal |
| **Reporté** | contour corail qui contourne les encoches, trait droit sur la perforation | « REPORTÉ » contour corail | normal |
| **Passé** | gris clair (`stubMuted`) jusqu’à la perforation | « PASSÉ » grise | atténué (60 %) |
| **Annulé** | sombre | « ANNULÉ » contour corail **barré** | assombri (50 %) |

Le texte du talon suit : noir sur corail, corail pour Reporté. Sur une photo (carrousel, grand visuel, fiche), le statut est la même pastille droite ; le cœur est un **rond blanc** dans le coin (`WishBadge`). Aucun tampon incliné.

## Composants

- **Grand visuel** (Découvrir) : photo pleine largeur en **parallaxe**, qui s’étire quand on tire vers le bas ; pastille en verre « Rap à l’affiche », nom en Anton, date et lieu, bouton blanc « Voir le concert ».
- **Carrousel « À l’affiche »** : cartes photo 250 × 330, la carte centrée pleine taille, ses voisines légèrement réduites et atténuées ; petit retour haptique quand une carte s’aligne. Statut en haut à gauche, cœur en haut à droite.
- **Barre en verre** (`GlassHeader`) : apparaît en haut quand on a défilé sous le grand visuel.
- **Verre** (`Glass`, `GlassPill`, `GlassIconButton`) : flou réel sur iOS, surface translucide sur Android ; bouton rond 44 pt. Bouton actif (concert dans les envies) : **fond blanc plein, icône noire**.
- **Fiche concert** : photo d’en-tête qui se pose (léger zoom arrière), boutons en verre fixes en haut (retour, cœur), pastilles date / statut / envie, nom en Anton ; **Billetterie** lime avec halo ; le **pass** : salle sur toute la largeur (icône, nom, adresse, chevron ›, ouvre la fiche salle), grille d’infos encadrée (date, heure, ville, prix), perforation horizontale, code-barres décoratif ; line-up en **avatars ronds cliquables** (fiche artiste).
- **Tuiles de ville** : photo d’un artiste qui y joue, dégradé, nom et nombre de concerts.
- **Bouton principal** : fond lime, texte noir Inter gras. Un seul par écran. **Bouton secondaire** : contour clair, fond transparent.
- **Lignes cliquables** (artiste, salle, ville, choix) : 44 pt minimum, icône ou avatar à gauche, chevron › pour ouvrir une fiche, coche pour une option choisie.
- **Mention de source** : petite, texte secondaire, sur la fiche concert.
- **Pastilles de filtre** (V1.2) : fond surface, contour discret, texte secondaire et petite flèche ; actives : fond `surfaceRaised`, contour et texte clairs, valeur choisie affichée. **Jamais de lime.** Elles passent à la ligne plutôt que de défiler.
- **Ligne de résumé** (V1.2) : nombre de résultats à gauche, « Réinitialiser (n) » à droite dès qu’un filtre est actif.
- **Panneau de choix** (V1.2, `FilterSheet`) : monte du bas sur fond assombri, coins arrondis en haut, petite barre de prise ; 75 % de l’écran au maximum, actions fixes en bas. Fermeture en touchant le fond ou avec le retour Android.
- **Envies** (V1.3) : cœur blanc, jamais lime. Retrait depuis l’onglet Envies **comme on l’a ajouté**, avec annulation temporaire (`UndoRow`, 4 secondes).

## Mouvement et haptique

- Apparition d’un bloc : fondu de 0,24 s. « Pop » du cœur : 0,16 s aller-retour. Appui : ressort court, sans rebond visible.
- Haptique : léger à l’ouverture d’une carte, « sélection » quand un carrousel s’aligne ou qu’on choisit un filtre, « succès » quand on ajoute une envie ou qu’on suit un artiste.
- Pas de bandeau défilant ni d’animation en boucle.

## Principes d’expérience

- Thème sombre uniquement.
- États chargement (squelettes), vide (message + suggestion) et erreur (message + « Réessayer ») sur chaque écran.
- Données manquantes gérées proprement : pas de champ vide, pas de « null ».
- Conventions iOS et Android (zones sûres, retour arrière, 44 pt minimum). Libellés VoiceOver sur les billets et boutons-icônes ; éléments décoratifs (perforations, code-barres) masqués aux lecteurs d’écran.

## Identité

Nom : **Vybe**.

- **Logo / icône** : « V égaliseur » — un V lime dont la branche droite est découpée en bandes verticales (évoque le son et le live), sur fond `#0A0A0A`. Source : `assets/brand/logo-mark.svg`.
- **Mot-symbole** : « VYBE » en Anton lime, utilisé sur l’écran de démarrage. Source : `assets/brand/wordmark.svg`.
- Les PNG (icône iOS, icône adaptative et monochrome Android, écran de démarrage, favicon) sont générés par `npm run icons` : ne pas les retoucher à la main, modifier les SVG puis relancer la commande.
- L’icône principale n’a pas de canal de transparence (exigence de l’App Store) ; le logo Android tient dans la zone sûre (cercle central de 66/108).
