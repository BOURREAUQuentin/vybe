# Vybe — Cahier des charges v1.4

Application mobile de concerts & festivals · Document de travail · 11 novembre 2026 · iOS et Android · France entière

> Source de vérité fonctionnelle du projet. Le périmètre de chaque version est fixé par la section 12.

# Suivi des versions

| **Version** | **Date**   | **Modifications**                                                                                                                                                                                          |
|-------------|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1.0         | 08/11/2026 | Première version du cahier des charges.                                                                                                                                                                    |
| 1.1         | 08/11/2026 | Ajout des salles favorites, souvenirs rétrospectifs, premières parties, benchmark DICE/Shotgun et section RGPD.                                                                                            |
| 1.2         | 11/11/2026 | Refonte du découpage fonctionnel en versions livrables et testables séparément (section 12).                                                                                                               |
| 1.3         | 11/11/2026 | MVP fondé sur des données factices, version dédiée à l’intégration Ticketmaster, festivals reportés, connexion par e-mail, définition commune de « terminé », mise en cohérence de l’ensemble du document. |
| 1.4         | 11/11/2026 | Nom de l’application (Vybe), rythme des notifications de souvenirs, connexion par e-mail uniquement jusqu’à la publication sur les stores, festivals confirmés en V2.3.                                    |

*Ce document constitue une base de cadrage fonctionnelle et technique. Les choix définitifs de conception, d’architecture, de fournisseurs, de budget et de conformité seront confirmés au fil du projet.*

# 1. Présentation du projet

**Vybe** est le nom de l’application.

Le projet consiste à créer une application mobile iOS et Android dédiée à la découverte, au suivi, à la planification et à la mémoire des concerts et festivals.

L’application doit accompagner l’utilisateur avant, pendant et après les événements.

Le positionnement initial mettra particulièrement en valeur le rap, tout en restant ouvert à tous les genres musicaux afin de toucher un public large.

Il s’agit d’un projet personnel, développé de manière progressive avec l’assistance de Claude (Claude.ai pour le cadrage, Claude Code pour le développement).

## 1.1 Les trois promesses de l’application

1.  **Ne jamais rater un concert :** suivre ses artistes, salles et lieux favoris et être informé des nouvelles dates.

2.  **Ne jamais manquer une découverte :** trouver des artistes et événements pertinents, y compris en dehors de ses habitudes.

3.  **Ne jamais oublier ses concerts :** conserver une mémoire personnelle et consultable de ses expériences live.

# 2. Public cible et périmètre

- **Public :** grand public, amateurs occasionnels comme passionnés de concerts.

- **Zone de lancement :** France entière.

- **Plateformes :** iOS et Android.

- **Genres :** rap mis en avant au lancement, sans exclure les autres styles musicaux.

- **Découverte :** événements d’artistes suivis et recommandations de nouveaux artistes.

- **Historique :** suivi complet de la vie concert de l’utilisateur, avec évolution progressive des souvenirs, médias et statistiques.

# 3. Fonctionnalités principales (cible)

*Cette section décrit la cible fonctionnelle complète de l’application. Le calendrier de mise en œuvre de chaque fonctionnalité est fixé par la section 12 : une fonctionnalité citée ici n’est pas forcément présente dans le MVP.*

## 3.1 Compte, profil et préférences musicales

- Création de compte, connexion, récupération de compte et gestion du profil.

- Sélection des genres musicaux favoris et des préférences de découverte.

- Suivi d’artistes avec possibilité de définir un niveau d’intérêt ou une priorité.

- Gestion de plusieurs villes favorites, avec une ville principale et un rayon de recherche.

- Ajout de salles de concerts favorites : l’utilisateur peut suivre des salles précises et être informé de leur programmation.

- Recherche libre d’événements partout en France, même en dehors des villes favorites.

- Géolocalisation facultative, avec possibilité de saisir manuellement une ville.

## 3.2 Découverte et recherche d’événements

- Flux personnalisé de concerts, festivals et événements musicaux.

- Mise en avant des événements liés aux artistes, villes et salles suivis.

- Recommandations de nouveaux artistes et événements susceptibles de plaire à l’utilisateur.

- Recherche par artiste, genre, ville, distance, date, salle, festival et prix lorsque cette information est disponible et vérifiée.

- Filtres et tris par date, proximité, popularité ou pertinence, genre et type d’événement.

- Possibilité d’explorer une ville ou une zone géographique sans modifier les préférences principales.

## 3.3 Fiche événement

- Nom de l’événement, artiste(s), date, horaires et lieu.

- Programmation complète lorsque disponible, y compris les premières parties et autres artistes présents.

- Informations pratiques : adresse, accès, salle, festival, organisateur et éventuelles restrictions.

- Prix et catégories tarifaires uniquement lorsque l’information est fournie par la source et suffisamment fiable.

- Statut : annoncé, billetterie ouverte, complet, reporté, annulé ou passé.

- Lien vers la billetterie ou la plateforme officielle de vente.

- Mention visible de la source des données (par exemple « Source : Ticketmaster »), conformément aux règles d’attribution de chaque source.

## 3.4 Notifications et alertes

- Annonce d’un concert d’un artiste suivi.

- Ajout d’une nouvelle date ou d’une date supplémentaire.

- Ouverture de la billetterie ou rappel avant mise en vente lorsque l’information est connue.

- Concerts correspondant aux villes et salles favorites.

- Rappels avant un événement enregistré dans l’agenda.

- Information en cas de report, d’annulation ou de changement important, si la source le permet.

- Recommandations personnalisées de concerts et d’artistes.

- Préférences configurables par catégorie, avec maîtrise de la fréquence et prévention des notifications en doublon.

## 3.5 Souvenirs et notifications rétrospectives

En complément des alertes liées aux événements à venir, l’application pourra envoyer des notifications de type « souvenir », inspirées des rétrospectives proposées par certaines applications sociales comme Snapchat.

**Exemples :**

- « Il y a 5 mois, tu assistais au concert de \[artiste\] à \[salle/ville\]. »

- « C’était il y a un an… »

- « Ton premier concert de \[artiste\] ! »

- « Il y a 6 mois, tu étais au festival \[nom\]. »

**Fonctionnement souhaité :**

- Ouverture de la notification vers la fiche souvenir correspondante dans l’historique.

- Possibilité de revoir les photos, notes, commentaires, artistes présents et autres éléments associés, si l’utilisateur les a renseignés.

- Activation ou désactivation dédiée.

- **Rythme limité pour éviter le spam :** un souvenir n’est envoyé qu’aux dates anniversaires d’un concert, à 1 mois, 6 mois, 1 an, puis chaque année (2 ans, 3 ans, etc.).

- Au maximum une notification de souvenir par jour : si plusieurs souvenirs tombent le même jour, ils sont regroupés en une seule notification.

- Possibilité de désactiver certains paliers ou catégories de souvenirs.

- Souvenirs générés uniquement à partir des concerts confirmés par l’utilisateur (« Tu y étais ? »), pour garantir des rappels fiables.

L’objectif est de donner envie à l’utilisateur de revenir régulièrement dans l’application et de valoriser son historique personnel.

## 3.6 Agenda et liste d’envies

- Enregistrement d’événements dans une liste « Envie d’y aller ».

- Agenda des concerts à venir avec statut : envie, j’y vais, billet acheté, ne participe plus.

- Ajout facultatif d’un lien, d’une référence ou d’une pièce jointe liée au billet.

- Rappels configurables avant les événements.

- Possibilité d’exporter un événement vers le calendrier natif du téléphone.

- À terme, prise en charge de billets PDF ou de photos de billets, sous réserve des exigences de sécurité et de protection des données.

## 3.7 Historique, souvenirs et statistiques

L’historique doit devenir le journal personnel des concerts de l’utilisateur. Il doit être simple à compléter, agréable à parcourir et suffisamment structuré pour permettre des rétrospectives.

- Timeline chronologique de tous les concerts et festivals auxquels l’utilisateur a assisté.

- Pour chaque concert : artiste principal, date, salle, ville, festival et informations de l’événement.

- Ajout manuel de concerts passés, y compris ceux absents de la source de données.

- Possibilité d’ajouter les autres artistes présents sur la même affiche, notamment les premières parties, artistes invités ou co-plateaux, avec leur rôle (première partie, invité, co-tête d’affiche ou autre).

- Ajout de souvenirs personnels : photos, vidéos personnelles, commentaires, notes, anecdotes et appréciation du concert.

- Association facultative d’un billet ou d’un justificatif à un événement.

- Statistiques : nombre de concerts, artistes vus, salles fréquentées, villes visitées, festivals, genres musicaux et évolution par année, avec détail par artiste, salle, ville, festival, année et genre.

- Rétrospective annuelle de type « Wrapped » : moments marquants, artistes les plus vus, salles favorites, nombre de concerts et découvertes.

- Possibilité de corriger, compléter ou supprimer une entrée d’historique.

## 3.8 Fonctions sociales — évolution future

- Ajout d’amis et possibilité de partager certains concerts ou souvenirs.

- Affichage facultatif des amis intéressés ou présents à un événement.

- Création de groupes pour organiser des sorties.

- Paramètres de confidentialité précis : chaque utilisateur choisit ce qu’il partage et avec qui.

# 4. Navigation de l’application

La navigation cible est organisée autour de cinq onglets :

1.  **Découvrir :** flux de concerts, recommandations, recherche et filtres.

2.  **Artistes :** artistes suivis, recherche et fiches artistes.

3.  **Agenda :** événements enregistrés, liste d’envies et concerts à venir.

4.  **Historique :** concerts passés, souvenirs, médias et statistiques.

5.  **Profil :** préférences musicales, villes favorites, salles favorites, notifications, confidentialité et paramètres du compte.

**Évolution de la navigation selon les versions (détail en section 12) :**

| **Version**      | **Navigation**                                                                                            |
|------------------|-----------------------------------------------------------------------------------------------------------|
| V1.0 à V1.2      | Deux onglets : Découvrir et Recherche, plus une page Infos (à propos, mentions légales, confidentialité). |
| V1.3 et V1.4     | Découvrir, Recherche, Mes artistes, Envies, Profil.                                                       |
| À partir de V1.5 | Les cinq onglets cibles décrits ci-dessus.                                                                |

# 5. Direction artistique et expérience utilisateur

## 5.1 Charte graphique retenue : Direction A « Urbain & énergique »

Rap en avant, contrastes forts, lime acide sur noir profond, dans un esprit affiche de rue et file d’attente de salle.

| **Rôle**    | **Couleur** | **Usage**                                             |
|-------------|-------------|-------------------------------------------------------|
| Fond        | \#0A0A0A    | Arrière-plan principal                                |
| Surface     | \#1A1A1A    | Cartes, champs, barres                                |
| Accent lime | \#C6FF3D    | Actions principales, mises en avant (avec parcimonie) |
| Texte       | \#F5F5F0    | Texte principal                                       |
| Secondaire  | \#A8A8A0    | Texte secondaire, métadonnées                         |
| Alerte      | \#FF6B5E    | Annulé, erreurs                                       |

- **Nom et identité :** Vybe. Le logo et l’icône de l’application restent à créer, dans le respect de la charte ci-dessus.

- **Typographie :** Anton pour les titres (réservée aux grands titres), Inter pour tout le reste.

- **Pistes d’affinage :** utiliser l’accent lime avec parcimonie pour qu’il guide l’attention ; prévoir à terme des photos d’artistes avec un dégradé sombre dans les cartes mises en avant.

- **Portée des maquettes :** les maquettes existantes illustrent uniquement la charte graphique (couleurs, typographie, ambiance). Elles ne définissent ni les écrans, ni les boutons, ni les fonctionnalités de chaque version, qui sont fixés par la section 12.

## 5.2 Principes d’expérience

- Thème sombre, adapté à l’univers des concerts et de la musique live.

- Expérience moderne, fluide, immersive et lisible.

- Priorité à la découverte rapide d’événements et à l’accès simple aux informations essentielles.

- Design cohérent sur iOS et Android, en respectant les conventions propres à chaque plateforme.

- États vides, chargements, erreurs, événements annulés et données manquantes prévus sur chaque écran.

# 6. Benchmark des applications et services existants

L’objectif est d’étudier les applications déjà utilisées par le public afin d’identifier les bonnes pratiques, les attentes des utilisateurs et les opportunités de différenciation. Il ne s’agit pas de reproduire leurs interfaces ou fonctionnalités à l’identique. Le benchmark peut être mené en parallèle du développement et ne bloque pas le MVP.

## 6.1 Applications à étudier

**DICE** — référence à examiner pour la découverte personnalisée, le suivi d’artistes et de salles, les rappels de mise en vente, les événements enregistrés, et les fonctionnalités sociales et de recommandation.

**Shotgun** — référence à examiner pour la découverte d’événements, les festivals, la billetterie et la relation entre artistes, organisateurs et public.

**Autres applications** — d’autres applications de billetterie, de découverte musicale et de suivi de concerts pertinentes sur le marché français et européen pourront être étudiées.

## 6.2 Axes de comparaison

- Qualité de la recherche et de la découverte d’événements.

- Personnalisation du fil et recommandations.

- Suivi des artistes, salles et événements.

- Notifications, rappels et gestion des préférences.

- Fiches événements, programmation et informations pratiques.

- Parcours vers la billetterie et clarté des prix.

- Fonctions sociales et partage.

- Gestion de l’historique et des souvenirs après l’événement.

- Design, ergonomie, accessibilité et fluidité.

- Possibilités d’intégration technique ou de partenariat, selon les API, contrats et autorisations disponibles.

Le benchmark devra être réalisé à partir des versions disponibles au moment de l’étude. Les fonctionnalités, conditions d’accès aux données et possibilités d’intégration peuvent évoluer.

# 7. Sources de données, API et intégrations

La qualité et l’exhaustivité du catalogue d’événements sont essentielles.

## 7.1 Source retenue : Ticketmaster (Discovery API)

Ticketmaster est retenue comme source unique de données réelles. Elle est intégrée dans une version dédiée (V1.1). Le MVP (V1.0) fonctionne sur des données factices.

**Contraintes connues, à confirmer sur le compte développeur et dans les conditions d’utilisation en vigueur :**

- **Quotas :** quota par défaut annoncé de 5 000 appels par jour et 5 appels par seconde par clé ; dépassement signalé par une erreur HTTP 429. Des quotas plus élevés ne sont accordés qu’au cas par cas, après revue de conformité et de respect de la marque.

- **Profondeur de recherche :** une recherche ne renvoie pas de résultat au-delà du 1000e ; la synchronisation devra donc être découpée en tranches (période, ville ou genre).

- **Identifiant stable :** chaque événement doit être relié à son identifiant Ticketmaster, indispensable pour les mises à jour et les notifications.

- **Mise en cache et conservation :** l’affichage et la durée de conservation des données doivent respecter les conditions d’utilisation de Ticketmaster, à lire avant la conception de la synchronisation.

- **Attribution :** mention « Source : Ticketmaster » et lien vers la billetterie officielle de l’événement, conformément aux règles de marque.

- **Volume d’appels :** les conditions se réservent le droit de limiter les applications effectuant de gros volumes d’appels non liés à des actions directes d’utilisateurs ; la synchronisation planifiée doit rester raisonnable.

- **Sécurité :** la clé API n’est jamais intégrée à l’application mobile ; seul le backend appelle Ticketmaster.

## 7.2 Sources envisagées ultérieurement

Une deuxième source pourra être ajoutée si la couverture de Ticketmaster s’avère insuffisante (voir V1.2), sous réserve de ses conditions d’utilisation, de sa couverture et de ses coûts :

- Bandsintown : dates de tournée et suivi d’artistes selon l’accès disponible.

- Songkick : concerts et tournées selon la disponibilité des services et les conditions.

- Spotify, Apple Music ou Deezer : uniquement pour enrichir les préférences musicales et les recommandations, avec consentement et dans le respect de leurs API et politiques.

- Sources directes de salles, festivals, producteurs et organisateurs lorsque des flux ou partenariats sont possibles.

- Liens vers DICE, Shotgun et autres billetteries pour rediriger l’utilisateur vers la source officielle de réservation.

**Chaque nouvelle source devra être évaluée selon :**

- Couverture France, fraîcheur des données et champs disponibles.

- Règles de réutilisation, attribution obligatoire et possibilité de mise en cache.

- Quotas, coûts et stabilité.

Aucune intégration ne doit être considérée comme acquise avant validation technique, contractuelle et juridique. L’ajout d’une deuxième source impose la déduplication des événements dans la même version.

# 8. Back-office et administration

Dans un premier temps, le tableau de bord Supabase sert de back-office : consultation des données, corrections manuelles, masquage d’un événement erroné, suivi des synchronisations. Des outils dédiés pourront être développés lorsque le besoin apparaîtra.

**Besoins cibles :**

- Gestion des utilisateurs et des signalements.

- Gestion des artistes, événements, salles et festivals.

- Outils de correction et de déduplication des événements.

- Contrôle des sources, synchronisations, erreurs et données obsolètes (journal de synchronisation dès la V1.1).

- Gestion des notifications et campagnes d’information.

- Suivi des indicateurs d’usage et de qualité du catalogue.

- Journalisation des actions d’administration et gestion des rôles d’accès.

# 9. Exigences techniques et architecture

## 9.1 Architecture retenue (à confirmer pendant le MVP)

- **Application mobile :** React Native avec Expo, en TypeScript, pour iOS et Android.

- **Backend et base de données :** Supabase (PostgreSQL), projet hébergé dans une région de l’Union européenne.

- **Principe central :** l’application lit uniquement la base Supabase. Seul le backend (fonctions serveur Supabase et tâches planifiées) appelle les sources externes. Ce principe protège les clés API, respecte les quotas et permet de travailler sur des données factices tant que l’intégration réelle n’est pas faite.

- **Base de données :** conçue dès le MVP pour les versions suivantes, afin d’éviter des migrations lourdes (détail en 12.2).

- **Notifications push :** via un service adapté aux deux plateformes, à partir de la V1.4.

- **Cartographie et géocodage :** à sélectionner selon les coûts, conditions d’utilisation et exigences de confidentialité (V1.2 pour la proximité, V2.2 pour la carte).

## 9.2 Outils de développement

- Claude Code pour le développement, avec un fichier CLAUDE.md décrivant la stack, les conventions et les règles du projet.

- Git et GitHub pour le versionnage, avec un tag par version livrée.

- Expo Go et builds de développement pour tester sur les appareils du porteur de projet.

## 9.3 Qualité et exploitation

- Gestion des erreurs, tests automatisés sur les parties critiques (synchronisation, déduplication, notifications).

- Sauvegardes et supervision, renforcées avant toute diffusion à des utilisateurs.

- Un environnement de développement suffit jusqu’au MVP ; un environnement de production séparé est créé avant toute diffusion à d’autres utilisateurs.

## 9.4 Comptes développeur

- Compte Ticketmaster Developer : gratuit, nécessaire à partir de la V1.1.

- Compte Apple Developer (payant, annuel) et compte Google Play Console : nécessaires pour diffuser l’application à des testeurs (TestFlight, tests internes) ou sur les stores. Non requis pour les tests personnels du MVP.

# 10. Protection des données personnelles, RGPD et mentions légales

La protection des données est prévue dès la conception. Un compte, des préférences musicales, des villes favorites, un historique de concerts ou un identifiant de notification peuvent constituer des données personnelles.

## 10.1 Conformité selon les versions

| **Version**       | **Points RGPD**                                                                                                                                                                |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| V1.0 à V1.1       | Aucune donnée personnelle collectée. Mentions légales et politique de confidentialité minimales. Tout ajout d’un outil d’analyse ou de suivi des plantages doit être réévalué. |
| V1.2              | Géolocalisation ponctuelle et facultative, non conservée au-delà du besoin ; saisie manuelle d’une ville toujours possible.                                                    |
| V1.3              | Comptes utilisateurs (e-mail), préférences et favoris : RGPD complet (données, finalités, durées, droits, suppression du compte depuis l’application).                         |
| V1.4              | Consentement aux notifications ; jeton de notification déclaré comme donnée personnelle.                                                                                       |
| V2.0 et suivantes | Médias, notes et billets : analyse de risques complémentaire (voir 10.7).                                                                                                      |

## 10.2 Données susceptibles d’être traitées

- **Données de compte :** adresse e-mail, identifiant et informations de profil nécessaires au service.

- **Préférences :** genres favoris, artistes suivis, salles favorites et villes favorites.

- **Données d’usage :** événements consultés, enregistrés, ajoutés à l’agenda ou déclarés comme réalisés.

- **Localisation :** position ponctuelle si l’utilisateur choisit d’utiliser la géolocalisation.

- **Données techniques :** journaux, diagnostics, identifiants d’installation ou de notification, dans la mesure nécessaire.

- **Évolutions futures :** photos, vidéos, billets, justificatifs et informations éventuellement visibles sur ceux-ci.

## 10.3 Principes de gestion

- **Minimisation :** ne collecter que les données nécessaires à des finalités clairement définies.

- **Transparence :** expliquer quelles données sont utilisées, pourquoi, par qui et pendant combien de temps.

- **Base légale :** déterminer une base légale adaptée à chaque finalité ; ne pas supposer que le consentement est toujours la base appropriée.

- **Durées de conservation :** définir des durées proportionnées et documentées, puis supprimer ou anonymiser les données lorsqu’elles ne sont plus nécessaires.

- **Sécurité :** contrôler les accès, chiffrer les échanges, protéger les comptes et limiter les données accessibles.

- **Prestataires :** vérifier les contrats, les rôles respectifs, les sous-traitants, les transferts hors Espace économique européen et les mesures de sécurité.

- **Cookies et traceurs :** évaluer les obligations applicables si l’application utilise des SDK, outils de mesure d’audience ou technologies similaires.

## 10.4 Droits des utilisateurs

L’application devra permettre aux utilisateurs d’exercer les droits prévus par la réglementation, selon les traitements concernés : droit d’accès, de rectification, à l’effacement, à la limitation du traitement, d’opposition, et à la portabilité lorsqu’il s’applique.

- Informer les utilisateurs de leurs droits et mettre en place un moyen simple de les exercer.

- Permettre la suppression du compte depuis l’application et traiter les données associées selon les obligations légales.

- Conserver une trace du traitement des demandes et respecter les délais réglementaires.

## 10.5 Géolocalisation

- Géolocalisation facultative, activée à l’initiative de l’utilisateur, avec une alternative par saisie manuelle de ville ou de zone.

- Pas de suivi permanent en arrière-plan pour le simple besoin de découverte de concerts.

- Précision et durée de conservation limitées au strict nécessaire.

- Distinguer l’autorisation technique du système iOS/Android et l’information ou le consentement RGPD requis selon la finalité.

## 10.6 SDK et services externes

Les services de cartographie, d’analytics, de notifications push, de crash reporting, d’hébergement, d’authentification et de recommandations devront être recensés. Pour chacun : données transmises, finalités, accès, durées de conservation, sous-traitants et éventuels transferts internationaux.

## 10.7 Billets, QR codes et médias — évolutions futures

Si l’application permet ultérieurement d’importer des billets, QR codes, PDF, photos ou vidéos, une analyse de risques complémentaire sera nécessaire. Les billets peuvent contenir des identifiants d’accès ou des informations importantes pour la sécurité de l’utilisateur : l’accès devra être strictement limité et les fichiers protégés contre les partages ou expositions involontaires.

## 10.8 Mentions légales et documents à prévoir

- **Mentions légales :** identification de l’éditeur, responsable de publication, hébergeur et coordonnées de contact.

- **Politique de confidentialité :** données collectées, finalités, bases légales, destinataires, durées, droits et modalités de contact.

- **Informations RGPD :** présentées au bon moment dans les parcours de l’application.

- **Cookies/traceurs :** politique ou mécanisme de consentement si nécessaire selon les technologies retenues.

- **CGU,** et CGV si le service le justifie.

- **Procédures internes :** demandes de droits, incidents de sécurité et violations de données.

- **Registre des traitements :** documentation des traitements et des choix de conformité.

Les bases légales, durées de conservation et obligations précises devront être confirmées selon les traitements réellement mis en œuvre. Une revue par un DPO ou un conseil juridique spécialisé est à prévoir avant le lancement public. Ce cahier des charges ne remplace pas un avis juridique.

# 11. Modèle économique à étudier

- Modèle gratuit avec fonctionnalités essentielles.

- Freemium avec fonctionnalités avancées payantes.

- Abonnement premium éventuel.

- Affiliation ou partenariats avec billetteries (dont le programme d’affiliation Ticketmaster, à étudier), salles, festivals et organisateurs.

- Éventuelles offres partenaires, sous réserve de transparence et de respect des règles applicables.

Aucun modèle n’est arrêté à ce stade. Il devra être évalué selon la valeur apportée aux utilisateurs, les coûts de données et d’infrastructure, les possibilités de partenariat et l’indépendance éditoriale des recommandations.

# 12. Découpage fonctionnel et priorisation

## Principes

- Chaque version est livrable seule et ajoute un petit lot de fonctionnalités, avec une seule nouvelle brique technique majeure.

- Le MVP pose les fondations : architecture, structure de la base de données et interfaces de base, alimentées par des données factices. Il n’a ni compte, ni notification, ni appel à une API externe.

- L’application lit uniquement la base Supabase ; seul le backend appelle les sources externes.

- Les maquettes illustrent uniquement la charte graphique (voir 5.1) : le périmètre fonctionnel est fixé par cette section.

- Chaque version est testée et validée manuellement par le porteur du projet sur ses propres appareils (iOS et Android) avant de passer à la suivante.

## Définition de « terminé » (commune à toutes les versions)

Une version est terminée lorsque tous les points suivants sont vérifiés :

- Toutes les fonctionnalités de la version sont présentes et testées sur iPhone et sur Android.

- Les états vides, chargements et erreurs sont gérés sur chaque écran ajouté ou modifié.

- Aucun plantage constaté pendant les tests.

- Le code est versionné sur GitHub, avec un tag correspondant à la version.

- Le CLAUDE.md et, si le périmètre a changé, ce cahier des charges sont à jour.

- Le critère spécifique de la version (« Terminé quand ») est atteint.

## Vue d’ensemble

| **Version** | **Thème**                   | **Brique technique principale**                                       |
|-------------|-----------------------------|-----------------------------------------------------------------------|
| V1.0        | Fondations (MVP)            | Architecture, schéma de base de données, interfaces, données factices |
| V1.1        | Données réelles             | Synchronisation Ticketmaster côté serveur                             |
| V1.2        | Meilleure consultation      | Filtres, géolocalisation, deuxième source éventuelle                  |
| V1.3        | Compte et favoris           | Authentification par e-mail, données utilisateur                      |
| V1.4        | Notifications               | Détection des nouveaux événements, notifications push                 |
| V1.5        | Agenda et historique simple | Statuts d’événements, rappels, saisie manuelle                        |
| V2.0 à V2.3 | Enrichissement              | Médias, statistiques, recommandations, festivals, billets             |
| V3.0 à V3.2 | Social et partenariats      | Amis, groupes, partage, premium                                       |
| V4          | Expansion                   | Pays pilote hors de France                                            |

## 12.1 MVP (V1.0) : fondations et données factices

**Objectif :** disposer d’une base saine (architecture, structure de base de données, interfaces de base) qui fonctionne de bout en bout avec des données factices, avant de brancher une source réelle.

**Fonctionnalités**

- Accès libre, sans inscription ni connexion.

- Page Découvrir organisée en sections, sans réglage utilisateur : par exemple « Rap à l’affiche » (mise en avant du positionnement), « Cette semaine », « Par ville », « Par genre ». Les concerts sont triés par date.

- Recherche par artiste, concert ou ville.

- Fiche artiste : nom, photo si disponible, courte description si disponible, concerts à venir.

- Fiche concert : artiste(s), date, heure, salle, ville, prix indicatif s’il est renseigné, bouton vers la billetterie et mention de la source, tous deux alimentés par la base (au MVP : lien factice et mention « Données de démonstration »).

- Concerts uniquement : les festivals sont reportés à une version ultérieure (V2.3).

**Navigation :** deux onglets, Découvrir et Recherche, plus une page Infos (à propos, mentions légales, confidentialité).

**Données et technique**

- Données factices écrites dans la base Supabase par un script de remplissage (artistes, salles, villes et concerts fictifs mais réalistes, en nombre suffisant pour tester les sections et la recherche).

- Données factices calquées sur les champs documentés de la Discovery API de Ticketmaster, pour faciliter le branchement en V1.1.

- L’application lit uniquement Supabase ; aucun appel à une API externe.

- **Base de données pensée pour les versions suivantes** (à noter dans le CLAUDE.md) :

  - champs « source » et « identifiant externe » sur chaque événement, artiste et salle ;

  - type d’événement (concert, festival) prévu même si seuls les concerts sont affichés ;

  - table de liaison événement–artistes avec un rôle (tête d’affiche, première partie, invité, co-tête d’affiche) ;

  - statut d’événement (annoncé, billetterie ouverte, complet, reporté, annulé, passé) ;

  - possibilité d’événements créés par un utilisateur, non reliés à une source (ajout manuel en V1.5) ;

  - table unique « événements de l’utilisateur » avec un champ statut, prévue pour la V1.3.

- Back-office : le tableau de bord Supabase suffit (corrections manuelles, masquage d’un événement).

**RGPD :** aucune donnée personnelle collectée. Mentions légales et politique de confidentialité minimales.

> **Terminé quand :** l’application affiche les données factices sur iPhone et Android, la navigation entre Découvrir, Recherche, fiches artiste et concert et page Infos est complète, et le schéma de base de données couvre les besoins listés ci-dessus.

## 12.2 V1.1 : données réelles Ticketmaster

**Objectif :** remplacer les données factices par le catalogue réel, en maîtrisant quotas, mise en cache et attribution.

- Lecture préalable des conditions d’utilisation et des règles de marque de Ticketmaster (mise en cache, durée de conservation, attribution, volume d’appels).

- Traitement serveur planifié (fonction Supabase) qui récupère les concerts en France via la Discovery API et les écrit en base. La clé API reste côté serveur.

- Synchronisation découpée en tranches (période, ville ou genre), en respectant les quotas et en gérant les erreurs de dépassement.

- Mise à jour des événements existants grâce à leur identifiant stable : changement de date, de salle ou de statut (reporté, annulé, complet).

- Correspondance entre les genres Ticketmaster et les genres de l’application.

- Attribution sur la fiche concert : mention « Source : Ticketmaster » et bouton « Billetterie officielle » vers la page de l’événement.

- Journal de synchronisation consultable dans Supabase : date, nombre d’événements ajoutés ou modifiés, erreurs.

- Les événements identifiés comme festivals par Ticketmaster sont enregistrés avec le type « festival » mais ne sont pas affichés avant la V2.3.

- Les données factices restent disponibles pour le développement.

> **Terminé quand :** le catalogue réel s’affiche dans l’application, la synchronisation tourne plusieurs jours de suite sans dépasser les quotas, et une modification côté Ticketmaster (statut, date) est bien répercutée.

## 12.3 V1.2 : meilleure consultation

- Filtres : date, ville, genre, rayon géographique.

- Concerts « près de moi », avec une géolocalisation facultative et une saisie manuelle de ville.

- Fiche salle : adresse, concerts à venir.

- Ajout d’une deuxième source de données si la couverture est insuffisante. La déduplication des événements entre sources est alors obligatoire dans cette même version.

> **Terminé quand :** les filtres se combinent correctement, le refus de la géolocalisation est bien géré, et la fiche salle est accessible depuis la fiche concert.

## 12.4 V1.3 : compte et favoris

- Inscription et connexion par e-mail uniquement (via Supabase). Les connexions Apple et Google seront ajoutées au moment de la publication sur l’App Store et le Google Play Store ; sur iOS, proposer la connexion Google imposera de proposer aussi la connexion Apple.

- L’application reste consultable sans compte. Le compte n’est demandé que pour suivre, enregistrer et personnaliser.

- Suivi d’artistes et page Mes artistes.

- Liste d’envies, stockée dans la table unique « événements de l’utilisateur » avec un champ statut (envie, j’y vais, j’y étais), réutilisée en V1.5.

- Villes et salles favorites, préférences de genres.

- Onboarding court : « Suis quelques artistes », à partir d’une liste d’artistes rap populaires.

- Profil, paramètres de confidentialité, suppression du compte et des données depuis l’application.

- RGPD complet pour les comptes : données collectées, durée de conservation, droits des utilisateurs.

**Navigation :** Découvrir, Recherche, Mes artistes, Envies, Profil.

> **Terminé quand :** un compte peut être créé, les artistes suivis et envies sont retrouvés après déconnexion et reconnexion, et la suppression du compte efface bien les données associées.

## 12.5 V1.4 : notifications

- Notification « nouveau concert » pour un artiste suivi : le traitement de synchronisation (V1.1) détecte les nouveaux événements grâce à leur identifiant stable, les relie aux artistes suivis et envoie les notifications sans doublons. L’API n’est jamais interrogée artiste par artiste, pour que le nombre d’appels ne dépende pas du nombre d’utilisateurs.

- Notification pour les nouveaux concerts dans les villes et salles favorites.

- Réglages des notifications par type et maîtrise de la fréquence.

- Vérification préalable des conditions Ticketmaster sur le volume d’appels non liés à des actions d’utilisateurs.

- RGPD : consentement aux notifications et mention du jeton de notification comme donnée personnelle dans la politique de confidentialité.

> **Terminé quand :** les notifications arrivent sur iPhone et Android, aucun doublon n’est envoyé, et la désactivation d’un type de notification est respectée.

## 12.6 V1.5 : agenda et historique simple

- Statut « J’y vais » et agenda des concerts à venir.

- Rappels avant le concert (J-7, J-1).

- Historique : après la date, une confirmation légère (« Tu y étais ? ») fait passer le concert dans l’historique. Seuls les concerts confirmés y entrent, ce qui garantit un historique fiable pour les souvenirs (V2.1).

- Ajout manuel d’un concert passé : saisie libre (artiste, date, salle, ville), enregistrée comme un événement créé par l’utilisateur et non relié à la source, car Ticketmaster fournit surtout des événements à venir.

**Navigation :** les cinq onglets prévus en section 4.

> **Terminé quand :** un concert passe de l’agenda à l’historique après confirmation, les rappels sont reçus, et un concert ajouté à la main apparaît dans l’historique.

## 12.7 V2.0 : historique enrichi

- Premières parties et autres artistes présents, y compris ajoutés manuellement.

- Notes personnelles et anecdotes.

- Photos et médias liés au concert.

## 12.8 V2.1 : souvenirs et statistiques

- Notifications de souvenirs aux paliers 1 mois, 6 mois, 1 an, puis chaque année, limitées à une par jour (voir 3.5).

- Statistiques : artistes, salles, villes, nombre de concerts.

- Rétrospective annuelle.

## 12.9 V2.2 : recommandations et outils pratiques

- Recommandations personnalisées avancées.

- Carte des concerts.

- Export vers le calendrier.

- Notifications avancées (ouverture de billetterie, dernières places), selon les données disponibles.

## 12.10 V2.3 : festivals et billets

- Première version gérant les festivals : aucun festival n’est affiché avant la V2.3.

- Fiche festival : dates, lieu, line-up si disponible, lien vers la billetterie. Un événement n’est présenté comme festival que lorsque la source permet de l’identifier.

- Programme sur plusieurs jours et programme personnel.

- Ajout de billets PDF ou photos avec une sécurité adaptée (stockage chiffré, accès protégé).

## 12.11 V3.0 : social de base

- Amis : ajout, invitation, liste d’amis.

- Partage d’un concert.

- Visibilité facultative des amis qui vont à un événement (désactivée par défaut).

## 12.12 V3.1 : communauté

- Groupes (sorties à plusieurs, groupes de fans).

- Activité partagée entre amis : concerts et souvenirs communs.

## 12.13 V3.2 : partenariats et premium

- Partenariats renforcés (billetteries, salles, festivals).

- Fonctionnalités premium éventuelles : statistiques avancées, stockage étendu, alertes prioritaires.

## 12.14 V4 : expansion

- Expansion hors de France, en commençant par un pays pilote.

*Les versions V2.0 et suivantes recevront leur critère « Terminé quand » au moment où elles seront détaillées.*

# 13. Risques et points de vigilance

- **Dépendance à une source unique :** quotas, coûts, changement de conditions ou interruption du service Ticketmaster.

- **Exhaustivité du catalogue :** aucune source unique ne garantit de couvrir tous les concerts, notamment les petites salles et la scène rap émergente.

- **Écart entre données factices et réelles :** des champs attendus peuvent manquer ou être mal renseignés dans les données réelles ; d’où des données factices calquées sur la documentation de l’API.

- **Fraîcheur et fiabilité :** dates, horaires, prix, salles et programmations peuvent changer.

- **Doublons et incohérences** en cas d’ajout d’une deuxième source.

- **Protection des billets, QR codes et médias** si ces fonctionnalités sont développées.

- **Conformité RGPD** et sécurité des données personnelles.

- **Coûts :** comptes développeur (Apple notamment), infrastructure, cartographie, notifications, stockage et acquisition.

- **Surcharge de notifications :** importance des préférences et de la maîtrise de la fréquence.

# 14. Indicateurs de réussite (KPIs)

Pendant la phase de développement (V1.0 à V1.5), la validation est manuelle et repose sur la définition de « terminé » (section 12). Les indicateurs suivants s’appliqueront à partir de l’ouverture à des testeurs ou au public, avec un outil de mesure conforme au RGPD :

- Nombre d’inscriptions et d’utilisateurs actifs.

- Nombre moyen d’artistes, villes et salles suivis par utilisateur.

- Nombre d’événements consultés, enregistrés et ajoutés à l’agenda.

- Taux de clic vers la billetterie.

- Taux d’ouverture et de désactivation des notifications.

- Part des utilisateurs qui complètent leur historique après un événement, et taux d’usage des souvenirs rétrospectifs.

- Qualité du catalogue : taux de doublons, événements incomplets ou signalés.

- Rétention à 7, 30 et 90 jours.

# 15. Étapes suivantes

**Étapes réalisées**

- Cahier des charges fonctionnel relu et découpage en versions validé (v1.3).

- Périmètre du MVP défini : fondations et données factices.

- Source de données réelle choisie : Ticketmaster (V1.1).

- Charte graphique retenue : Direction A « Urbain & énergique ».

- Nom de l’application : Vybe.

**Prochaines étapes**

1.  Installer l’environnement de développement : Node.js, Git, compte GitHub, VS Code, Claude Code, Expo Go sur les téléphones de test.

2.  Créer le projet Supabase (région Union européenne).

3.  Créer le logo et l’icône de Vybe, selon la charte Direction A.

4.  Rédiger le CLAUDE.md : stack, conventions, structure du projet, charte graphique, règles (dont « l’app lit uniquement Supabase » et la base pensée pour les versions suivantes).

5.  Concevoir le schéma de base de données et le script de données factices.

6.  Développer et valider le MVP (V1.0).

7.  Avant la V1.1 : créer le compte Ticketmaster Developer et lire les conditions d’utilisation et règles de marque.

8.  En parallèle, sans bloquer le développement : benchmark de DICE, Shotgun et d’autres applications.

9.  Avant toute diffusion à d’autres utilisateurs : documents juridiques, documentation RGPD et comptes développeur Apple et Google.

10. Au moment de la publication sur l’App Store et le Google Play Store : ajouter les connexions Apple et Google.

# 16. Questions ouvertes

- Le nom Vybe est-il disponible (marque, nom sur les stores, nom de domaine) ?

- Quelles durées de mise en cache et de conservation autorisent les conditions de Ticketmaster ?

- La couverture de Ticketmaster sera-t-elle suffisante, en particulier pour le rap ? Sinon, quelle deuxième source retenir ?

- Quel niveau de détail pour les salles favorites : suivi de programmation, alertes par genre, rayon géographique ?

- Quel modèle économique privilégier après validation de l’usage ?

# 17. Références

- **Ticketmaster Developer :** documentation de la Discovery API, conditions d’utilisation (usages autorisés, mise en cache, quotas) et règles de marque.

- **Apple App Review Guidelines :** règles applicables aux connexions via des services tiers et à la suppression de compte.

- **DICE :** parcours de découverte, de suivi d’artistes et d’événements.

- **Shotgun :** découverte d’événements, festivals et billetterie.

- **CNIL :** recommandations relatives aux applications mobiles, aux SDK, à la géolocalisation, à la minimisation et à la sécurité des données.

Les fonctionnalités et conditions des services tiers devront être vérifiées au moment de leur utilisation. Les conditions d’accès aux données peuvent différer des fonctionnalités visibles dans leurs applications.

# Conclusion

Vybe ambitionne de devenir le compagnon personnel des amateurs de concerts : un outil pour découvrir les événements, suivre les artistes, organiser ses sorties et conserver une mémoire durable de ses expériences live.

Le MVP pose des fondations solides (architecture, base de données, interfaces) sur des données factices. Les versions suivantes ajoutent une brique à la fois : données réelles Ticketmaster, consultation enrichie, comptes, notifications, puis agenda et historique. Les fonctionnalités de souvenirs, d’historique enrichi et de communauté construiront ensuite une expérience différenciante.

La protection des données personnelles est intégrée dès la conception, et non ajoutée après coup. Les choix techniques et juridiques devront être confirmés avant toute diffusion publique.

**Fin du cahier des charges — Version 1.4**

*Document de cadrage évolutif. Les fonctionnalités, fournisseurs et obligations mentionnés sont des pistes à confirmer pendant les phases de conception, de développement et de validation juridique.*
