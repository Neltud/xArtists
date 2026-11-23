# Architecture de navigation xArtists — 23 novembre 2026

Le problème était la fragmentation : le menu reflétait les dossiers techniques, les pages répétaient titres et explications génériques, et les fonctions nécessaires à un même usage étaient dispersées. La liste donnée en conversation servait d'exemple, pas de menu à recopier.

## Ordre et rôle des espaces

| Priorité | Espace | Usage | Regroupement |
| --- | --- | --- | --- |
| Transversal | Mon espace | Retrouver sa session et ce qu'on possède | Wallet + portfolio dans une page ; compte et identité dans sa navigation locale |
| 1 | Marketplace | Découvrir l'art et examiner une offre | Catalogue, expositions, sélections, provenance ; enchères et analyses en outils secondaires |
| 2 | Studio | Préparer et présenter une œuvre | Œuvre, exposition, collections/diffusion, droits/licences ; outils spécialisés ensuite |
| 3 | Agents & IA | Consulter une analyse et utiliser ses accès | xOrus, catalogue d'agents, mes agents/accès, laboratoire |
| 4 | Écosystème | Comprendre et participer au projet | Gouvernance, token $TRO, disponibilité par réseau, soutien ; DeFi dans la feuille de route |
| Utilitaire | Aide & projet | Trouver une réponse ou une information de service | Guide, installation, statut, légal, documentation, feuille de route |
| Interne | Exploitation | Examiner les outils opérateur | Command Center et anciens journaux IA ; aucune confusion avec un relevé personnel |

Le wallet accompagne les parcours. Il ne bloque pas l'entrée dans le catalogue. Le logo ramène à l'accueil. Sur mobile, les quatre espaces et Mon espace occupent les cinq destinations persistantes ; chaque ancienne URL et chaque alias restent pris en charge.

## Trois niveaux de navigation

1. **Global** : choix de l'espace de travail, identique dans l'en-tête, le menu mobile et le dock.
2. **Local** : les outils du même parcours, dans un ordre utile. Par exemple Studio → exposition → distribution → droits, ou xOrus → agents → mes accès → laboratoire.
3. **Optionnel** : autres outils, expériences et feuille de route, révélés volontairement. Les utilitaires ne sont plus mélangés aux actifs personnels.

`apps/frontend/src/experience/informationArchitecture.ts` est la source commune des propriétaires, niveaux, libellés et priorités des 44 modules. Le registre de routes continue de porter les chemins et alias. La recherche reconnaît aussi les anciens noms et chemins. L'annuaire classe les outils par usage, puis permet de filtrer leur état de disponibilité.

## Fusions livrées et limites

| Avant | Après | Portée réelle |
| --- | --- | --- |
| Wallet et Portfolio séparés | Une page wallet avec Vue d'ensemble / Mes actifs | Une seule lecture du compte pour les soldes, tokens et NFT ; `/portfolio` conserve paramètres et fragment puis ouvre la vue actifs |
| Simulation et carte des modules isolées | Vues Simulation / Connexions du laboratoire | Les anciens chemins ouvrent les vues existantes ; aucun moteur remplacé |
| Agents, packs détenus et analyse dans des groupes différents | Un même espace Agents & IA et sa navigation locale | Les droits d'accès restent vérifiés par leurs mécanismes existants ; aucune propriété inventée |
| Packs IA dans les catégories d'art | Catalogue d'agents dans Agents & IA | Les anciens liens marketplace `tab=packs` rejoignent le catalogue ; NFT d'art et accès aux agents restent distincts |
| Outils de création dispersés | Navigation locale du cycle créateur | Regroupement de parcours, sans prétendre partager un brouillon ou une sauvegarde que les outils n'ont pas |
| Token et gouvernance noyés dans Finance | Espace Écosystème | Information et participation d'abord ; les fonctions DeFi non prouvées restent secondaires |
| History dans Mon espace | Anciens journaux IA dans Exploitation | Ce fichier ne contient pas les transactions du wallet de l'utilisateur |
| Paiements locaux présentés dans le compte | Intentions locales parmi les outils avancés IA | Il s'agit de traces de préparation sur l'appareil, jamais d'un relevé bancaire ou d'une preuve de paiement |

Les titres appartiennent aux pages ; la coque apporte le contexte et la navigation. Les états de disponibilité restent visibles dans les cartes et près du fil d'Ariane. Les contrôles précis de transaction restent dans leur parcours. Les informations techniques de marché et la navigation de preuve mainnet sont disponibles par divulgation progressive.

## Direction visuelle

Violet pour les actions, la sélection et le focus ; surfaces neutres légèrement teintées ; modes clair et sombre conservés. L'accueil présente les espaces et un accès personnel, puis le cycle créateur. Les décorations et les répétitions de listes ne prennent plus le dessus sur l'action.

## Vérification attendue

- Chaque module possède exactement un espace ; tous les chemins et alias sélectionnent cet espace.
- Les entrées fusionnées restent accessibles via redirection avec conservation du contexte URL.
- Les espaces opérateur et les fonctions en feuille de route restent distincts des actions usuelles.
- Le changement de vue dans le wallet ne relance pas une deuxième lecture du compte.
- Une erreur de lecture ne présente pas des zéros comme des soldes vérifiés.
- Vérification responsive, clavier, huit langues, RTL, titres et liens internes sur le build de la PR.
- Aucun indicateur de paiement, mint ou trading n'est activé par cette architecture.
