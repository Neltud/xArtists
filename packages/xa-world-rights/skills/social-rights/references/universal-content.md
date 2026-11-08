# XA World Rights v0.5 — tous formats en préparation, droits à vérifier

## Positionnement

Tout format de contenu social peut faire l'objet d'une étude de valorisation : ce n'est pas la garantie que tout contenu est monétisable. Le titulaire doit pouvoir accorder les droits vendus pour les usages, territoires et durées du contrat. La disponibilité publique, l'achat d'un fichier, la connexion d'un compte, une licence de musique de plateforme ou un NFT ne prouvent pas cette autorité. La monétisation publicitaire native est un autre programme avec ses propres conditions ; elle n'est ni évaluée ni activée ici.

## Catalogue de préparation

| Réseaux nommés | Mode dans cette version |
|---|---|
| X, YouTube, Instagram, TikTok | Dossier manuel ; seul YouTube possède un noyau OAuth non connecté |
| Facebook, Threads, LinkedIn, Pinterest, Snapchat, Twitch, Reddit, Bluesky, Mastodon | Dossier manuel ; aucun connecteur/API de ces réseaux |
| Autre plateforme ou site | Identification et revue manuelles ; aucune découverte automatique |

| Formats décrits | Éléments à inventorier selon le cas |
|---|---|
| Texte, article, newsletter, document | Auteur, citations, images incorporées, contributions et conditions de publication |
| Photo, illustration, carrousel | Visuel original, personnes, marques, chaque élément du carrousel |
| Vidéo courte, vidéo longue, enregistrement de direct, animation | Montage, extraits, musique/master/composition, voix, interprètes et participants |
| Audio, podcast | Voix, invités, musique, archives et conditions de réutilisation |
| Fichier 3D | Modèle, textures, bibliothèques, logos et autres composants |
| Lot mixte | Inventaire de chaque composant ; un élément non autorisé bloque l'ensemble pour l'usage concerné |
| Autre format | Description et revue manuelles |

Ce catalogue porte sur les dossiers et ne garantit pas que chaque réseau accepte tous les formats. Les restrictions de chaque plateforme, de sa région et de ses outils restent à vérifier avant toute utilisation réelle. Un contenu privé/supprimé/éphémère exige une source fournie avec autorisation ; aucune récupération, scraping ou reconstitution n'est effectuée.

## Modes commerciaux préparables

Prix fixe, proposition négociée et enchère restent des projets d'offres, avec licence exclusive ou non exclusive précisément délimitée. Les usages sont séparés : republication organique, publicité, éditorial, adaptation, sous-licence, revente et entraînement IA. L'accord sur un usage ne vaut pas accord sur les autres. Prix, royalties créateur et consentement restent versionnés. Une cession patrimoniale reste un contrat distinct à revoir, pas la conséquence d'un achat de licence.

## Évaluation exécutable

`scripts/content_intake.py dossier.json` exige mode préparation, identité créateur, famille de contenus, empreinte du master, source, références de revue des politiques et de consentement sur une proposition donnée. Chaque composant déclare son fondement, ses preuves, ses droits commerciaux, son autorité à licencier et les usages autorisés.

Les résultats restent `evidenceVerification: unverified`, `monetizationAuthorized: false`, `listingAuthorized: false`, `liveReady: false`. L'état `dossier_ready_for_review` indique uniquement la complétude déclarative pour une revue. Même un dossier parfait ne produit aucun reçu réel, droit d'accès ou publication. Les booléens d'entrée ne sont jamais acceptés comme des vérifications serveur.

Contrôles additionnels :

- Musique de plateforme : destinations explicitement couvertes, puis revue piste/région/campagne et droit de concéder une licence externe. Une musique TikTok n'est pas présumée autorisée sur Instagram ou sur le site d'un acheteur.
- Creative Commons/stock : conditions exactes et pouvoir d'accorder les droits proposés ; utilisation commerciale ne signifie pas sous-licence ou revente libre. Attribution et partage à l'identique doivent être examinés.
- Domaine public/CC : aucune promesse d'exclusivité sur les éléments préexistants ainsi accessibles. Un apport original distinct exige une nouvelle définition du périmètre avant une éventuelle exclusivité.
- IA, personnes/voix, marques : revue indépendante obligatoire ; aucun titre de propriété, consentement ou droit d'exploitation inféré automatiquement.
- Litige, élément manquant, doublon d'inventaire ou usage dépassant les autorisations déclarées : dossier bloqué jusqu'à clarification.

La famille de contenus sert à préparer le rapprochement des dérivés et republications. Elle n'est PAS un moteur de détection automatique ni une migration du registre. Le verrou transactionnel du registre reste fondé sur l'empreinte du master ; variantes recadrées/transcodées et licences hors registre exigent toujours revue et rattachement. Les schémas des reçus ne changent pas.

## Sources officielles et limites

Consultées le 2026-11-06 :

- https://support.google.com/youtube/answer/2490020 — droits commerciaux sur les éléments visuels/sonores et conditions propres à la monétisation YouTube.
- https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/commercial-use-of-music-on-tiktok — musique pour contenus commerciaux et licences nécessaires.
- https://ads.tiktok.com/resources/help/article/about-music-copyright-for-tiktok-one-creator-collaborations?lang=en — Commercial Sounds pour TikTok, restrictions et variation selon région/campagne ; pas d'autorisation automatique de republier ailleurs.

Ces sources ne constituent pas une validation des conditions des treize plateformes. Les conditions courantes des autres réseaux et les accords de chaque œuvre restent à lire. Aucune promesse universelle de monétisation ou de royalties garanties.

## Exemples

1. Illustration originale publiée sur LinkedIn : préparer licence éditoriale et devis ; demander séparément la publicité et l'entraînement IA.
2. Reel Instagram avec musique de bibliothèque : proposer une version master sans musique ou obtenir les autorisations adaptées au contrat externe.
3. Podcast diffusé sur YouTube puis extrait sur TikTok : inventorier invités, extraits et musique ; traiter les versions dans une même famille.
4. Carrousel Pinterest avec photos de tiers : bloquer les photos non autorisées, même si le texte est original.
5. Direct Twitch avec gameplay et invités : revoir licence du jeu, interventions et musique avant une offre d'extraits.
6. Texte Mastodon ou Bluesky : consentement créateur, portée et droits antérieurs avant tout listing ; aucun compte ou audience n'est vendu.

Statut : package privé de développement. Aucun ajout GitHub, déploiement, OAuth réel, publication/révocation sociale, paiement ou livraison réelle.
