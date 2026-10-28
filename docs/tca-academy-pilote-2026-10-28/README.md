---
description: >-
  Pilote TCA Academy : techniques artistiques, contextes culturels et ateliers
  originaux prêts à produire.
---

# TCA Academy — pilote de masterclasses

Proposition du 28 octobre 2026. Positionnement : **comprendre une œuvre, observer une technique, pratiquer et replacer son geste dans un contexte culturel**. Le programme ne présente pas les cultures comme des styles interchangeables et ne promet pas une certification académique.

#### Quatre masterclasses pilotes

| Cours                                          | Question et objectif                                                                      | Atelier original                                                          | Source de contexte                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| 1. Sfumato : dessiner sans tout cerner         | Distinguer bord dur, bord doux et variation de valeur                                     | Deux sphères au crayon, même éclairage et bords différents                | National Gallery, notice de La Vierge aux rochers  |
| 2. Paysage à l'encre : plein, vide et distance | Observer le geste et la composition dans des traditions de peinture chinoise              | Trois lavis d'un paysage imaginaire, zones de papier réservées            | The Met, Landscape Painting in Chinese Art         |
| 3. Géométrie : construire et répéter un motif  | Lire symétrie, répétition et contexte des arts du monde islamique                         | Rosace géométrique au compas, puis variation personnelle                  | The Met, Islamic Art and Geometric Design          |
| 4. Relief : forme, mémoire et provenance       | Lire le relief et le contexte des arts de cour du royaume de Benin, dans l'actuel Nigeria | Composition abstraite en papier superposé ; pas de faux objet patrimonial | Smithsonian, Benin Bronzes: Ambassadors of the Oba |

Le pilote est une proposition éditoriale, pas le résultat d'une étude de demande vidIQ. Ces institutions documentent les sujets et ne sont ni partenaires, ni caution de TCA Academy. Les ateliers contemporains ne prétendent pas reconstituer exactement les procédés historiques.

#### Format reproductible

Cible par masterclass : environ 20 minutes guidées, dont un temps d'atelier que l'élève peut mettre en pause. Français d'abord ; sous-titres révisés et version texte. La version anglaise vient après validation du vocabulaire et du montage français.

Chaque épisode comporte : question d'observation, contexte sourcé, démonstration originale, atelier, autocorrection et piste pour continuer. Le présentateur réel et les intervenants éventuels restent à confirmer. Un avatar historique doit être identifié comme une reconstitution pédagogique, jamais comme une personne réelle ayant enregistré le cours.

Le premier déroulé comprend conducteur, texte de présentation, atelier, critères d'autocorrection, titres et concepts de miniature. Le fichier `pilot-season-01.json` porte les objectifs, exercices et sources pour l'équipe produit. Il est marqué draft et ne remplace aucune donnée publique de la dapp.

#### VidIQ : usage utile et mesuré

Connexion vérifiée dans la conversation : une chaîne autorisée, 150 crédits disponibles. Deux appels de diagnostic à coût nul ont été utilisés, chacun déclarant 0 crédit consommé. Les analyses de mots-clés, catalogues vidéo, transcriptions et analytics consultées sont annoncées à 5 crédits par appel ; aucune n'a été lancée dans ce lot.

Étapes proposées après choix du budget de crédits :

1. Une recherche de demande en français pour le cours 1, avec observations réelles plutôt qu'un score inventé.
2. Lire un échantillon pertinent des vidéos de la chaîne autorisée, sans confondre les statistiques publiques et l'analytics privée.
3. Choisir deux titres testables et une miniature qui montre le résultat réellement enseigné.
4. Après publication approuvée, mesurer compréhension de la promesse, clics et rétention ; une petite audience ne suffit pas à promettre un résultat.

Aucune vidéo, miniature, playlist, identité de chaîne ou programmation n'a été modifiée. Les textes de titre ci-dessous sont des propositions éditoriales, sans score SEO ni prévision de vues.

#### Intégration progressive dans la dapp

Le repo possède déjà `TcaGatePage`, `TcaModuleOne`, un fichier `module_01_sfumato.json` et un mentor local extractif (`tcaRag.ts`). Cela ne prouve pas un mentor génératif externe disponible. Le module existant contient un identifiant vidéo ; sa propriété, sa licence et son adéquation au nouveau cours ne sont pas attestées ici.

Commencer par le cours filmé et sa transcription vérifiée. La 3D, l'avatar et le TTS sont des enrichissements séparés, pas des prérequis pour apprendre. Garder une version texte utilisable au clavier, des sous-titres et une alternative aux animations. Ne pas charger de piste audio ou service payant automatiquement.

Étape de raccordement proposée : mapper `lesson_id`, `video_id` réellement publié, chapitres, transcription, sources et `content_version` vers les données TCA existantes. Pas d'ID vidéo inventé ou de source tierce utilisée comme si elle appartenait à la chaîne.

Un aperçu public peut montrer la leçon décidée pour SAMPLE. Les droits FULL sont une décision produit et un contrôle serveur distincts : la connexion vidIQ, un `?paid=`, une donnée de navigateur ou un NFT détenu par LIA ne les accorde pas. Le cours n'écrit ni ledger de trading, ni mint/burn, ni rémunération promise.

#### Sortie du pilote

Avant publication : vérifier les faits, filmer les démonstrations, confirmer les droits de chaque média, réviser les sous-titres, tester mobile/texte/clavier et présenter à l'opérateur la vidéo, le titre, la miniature et la destination exacts. Les premiers retours doivent mesurer l'apprentissage, pas seulement les vues.

Sources documentaires consultées :

* [National Gallery — La Vierge aux rochers](https://www.nationalgallery.org.uk/paintings/leonardo-da-vinci-the-virgin-of-the-rocks?mibextid=Zxz2cZ).
* [The Met — Landscape Painting in Chinese Art](https://www.metmuseum.org/zh/essays/landscape-painting-in-chinese-art).
* [The Met — Islamic Art and Geometric Design](https://www.metmuseum.org/ko/learn/educators/curriculum-resources/islamic-art-and-geometric-design).
* [Smithsonian — Benin Bronzes](https://africa.si.edu/exhibitions/benin-bronzes-ambassadors-oba). Texte récupéré par recherche ; ouverture directe en timeout lors de ce contrôle.

Les liens sont des références de contexte. Aucun fichier image, vidéo ou transcription de tiers n'est inclus. Une image doit avoir sa licence ou son autorisation vérifiée individuellement avant utilisation.

#### Correctif préparé pour le mentor local

Le module `tcaRag.ts` relançait la même recherche sans filtre même quand cette recherche était déjà sans filtre et ne trouvait rien. Une question inconnue ou une base vide provoquait donc un débordement de pile. Le correctif local `7bc22143c480e26ac4419e3ee9c64196045e2112` autorise un seul relâchement du filtre professeur, puis rend la réponse d'absence de connaissance existante.

Les sept scénarios dédiés sont passés de 3 réussites / 4 échecs avant correction à 7 / 7. La suite frontend complète de cette branche passe 47 / 47 sous Node 20 et le build réussit. Les réponses connues, citations et périmètres de leçon restent couverts. Cette validation ne remplace pas la recette d'une vidéo publiée ni celle d'un mentor externe. Le correctif est local tant qu'aucun SHA distant n'est confirmé.

### Consulter le cours pilote

[Conducteur du cours 1 — sfumato](cours-01-sfumato.md).

[État des connexions et kit complet](../lia-copilot-tca-2026-10-28/).
