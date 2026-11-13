# Vybe — RGPD : registre des traitements et procédures

Version : V1.3 (compte et favoris). Référence : cahier des charges, section 10.
Document de travail pour un projet personnel : **il ne remplace pas un avis juridique** et doit être relu (voir « À valider » en fin de document) avant toute diffusion publique.

## Responsable du traitement

Quentin Bourreau, à titre personnel — contact : `vybe.infos@gmail.com`.

## Registre des traitements

| Traitement | Données | Finalité | Base légale | Conservation | Destinataires / sous-traitants |
|---|---|---|---|---|---|
| Compte utilisateur | Adresse e-mail, date de création, session | Créer le compte, se connecter (code à usage unique) | Exécution du service demandé | Tant que le compte existe ; effacement immédiat à la suppression | Supabase (hébergement, UE – Paris), Brevo (envoi du code) |
| Suivi d’artistes | Artistes suivis | Onglet « Mes artistes », leurs prochains concerts | Exécution du service demandé | Idem compte | Supabase |
| Liste d’envies | Concerts enregistrés (statut) | Onglet « Envies » | Exécution du service demandé | Idem compte | Supabase |
| Préférences | Villes favorites (ville principale, rayon), salles favorites, genres préférés | Personnalisation (« Près de chez toi ») | Exécution du service demandé | Idem compte | Supabase |
| Localisation ponctuelle | Position approximative (~1 km), non enregistrée | Concerts proches, à la demande | Demande explicite de l’utilisateur (« Me localiser ») | Non conservée (mémoire de l’app le temps de la session) | Transmise à Supabase dans la requête de filtrage, non enregistrée |
| Journaux techniques | Adresse IP, requêtes | Fonctionnement et sécurité du service | Intérêt légitime | Durée fixée par les hébergeurs (à préciser) | Supabase, Brevo |

Données gardées **sur le téléphone** (non transmises) : session de connexion, ville choisie pour « Près de chez toi », indicateur « onboarding déjà proposé ».

Aucun outil d’analyse, de publicité ou de suivi des plantages. Aucune revente de données.

## Exercice des droits

| Droit | Comment |
|---|---|
| Accès, portabilité | Profil › Mes données › « Exporter mes données » (texte JSON via le menu de partage) |
| Rectification | Dans l’application (Profil, fiches artiste, concert, salle) |
| Effacement | Profil › Mes données › « Supprimer mon compte » (fonction `delete_my_account()`, suppression en cascade de toutes les lignes du compte) |
| Opposition, limitation, autre demande | E-mail à `vybe.infos@gmail.com` |
| Réclamation | CNIL (cnil.fr) |

## Procédure : demande reçue par e-mail

1. Accuser réception et vérifier que la demande vient bien du titulaire du compte (réponse depuis l’adresse e-mail du compte).
2. Traiter la demande dans un délai d’**un mois** (prolongeable de deux mois si complexe, en informant la personne).
3. Pour un effacement : supprimer le compte depuis le tableau de bord Supabase (Authentication › Users) ; la cascade efface ses données.
4. Garder une trace minimale : date de la demande, type, date de la réponse (sans recopier les données concernées).

## Procédure : violation de données (fuite, accès non autorisé)

1. Contenir : révoquer les clés concernées (Supabase, Brevo), corriger la faille.
2. Évaluer : quelles données, combien de personnes, quels risques.
3. Notifier la **CNIL sous 72 heures** si la violation présente un risque pour les personnes ; informer les personnes concernées si le risque est élevé.
4. Documenter l’incident (même s’il n’est pas notifié).

## Mesures de sécurité en place

- Row Level Security sur toutes les tables : chaque utilisateur ne lit et n’écrit que ses propres lignes ; le catalogue est en lecture seule (test automatique : `supabase/tests/user-data-rls.sql`).
- Connexion sans mot de passe (code à usage unique) ; aucune clé secrète dans l’application ni dans Git (clé SMTP Brevo uniquement dans Supabase).
- Échanges chiffrés (HTTPS).

## À valider avant toute diffusion publique

- Relecture de la politique de confidentialité et de ce registre par un juriste ou un DPO.
- Supabase (siège aux États-Unis, données stockées dans l’UE) : vérifier le cadre contractuel (contrat de sous-traitance / DPA, encadrement des éventuels transferts hors UE).
- Brevo : signer / vérifier le contrat de sous-traitance (DPA).
- Durées de conservation des journaux techniques chez Supabase et Brevo.
- Expéditeur des e-mails : passer d’une adresse Gmail à un nom de domaine propre (et une adresse postale d’éditeur adaptée, voir Brevo).
- Mentions légales complètes et CGU.
