---
description: >-
  Revue UX desktop sans wallet du site xArtists, constats sourcés et priorités
  pour les parcours musée, agents et marketplace.
---

# Revue design & accessibilité — 8 novembre 2026

**Périmètre :** site public [xArtists](https://neltud.github.io/xArtists/), accueil → musée → agents / packs → marketplace, sans connexion wallet ni paiement. Inspection du navigateur desktop le 8 novembre + lecture des sources `apps/frontend`. **Ce n'est pas un audit WCAG certifié**, ni un test visuel exhaustif du mobile. Aucun screenshot exploitable n'a été exporté dans ce dossier ; l'usage du mot « vérifié » est limité aux états réellement observés.

## Parcours et santé

| Étape | Santé | Observation | Priorité |
| --- | --- | --- | --- |
| 1 — Accueil | Fonctionnel | Parcours « Explore art », « Getting started », « Roadmap », recherche globale, thèmes, langues, wallet facultatif | P2 simplifier la longueur après le premier écran |
| 2 — Musée | Utilisable mais dense | Galerie et œuvres accessibles ; multiples commandes, labels petits, 3D à tester sur écrans étroits | P1 simplifier commandes et alternatives texte |
| 3 — Agents / packs | **Information à corriger** | Marqueur « Preview only » présent, mais ancien repère `≈ 33 / 22,5 / 15 EGLD` près des prix EUR | **P0 retirer les montants trompeurs** |
| 4 — Pages produit | Partiellement clair | Prix EUR catalogue + mention estimative EGLD, tandis que le contrat indique 1 / 5 / 2,5 EGLD (8 novembre) | **P0 séparer relevé SC et prix catalogue** |
| 5 — Marketplace | Fonctionne en découverte | Liens /marketplace et /explore/market ; fiches packs qui peuvent évoquer un mint actif alors que le rail est fermé | **P0 « Découvrir » plutôt qu'« Acheter »** |
| 6 — Mobile & clavier | **Non vérifié dans cette inspection** | Le navigateur d'audit n'a pas permis la revue responsive ; les tests statiques/CI ne remplacent pas un test appareil | P1 campagne mobile + clavier |

## Correctifs inclus dans la branche de revue

- **Agents.tsx** : disparition du faux repère fiat→EGLD, ajout d'un relevé SC daté avec mention explicite « vente fermée », badge plus lisible et flux « prévu / non actif ».
- **PackLandingPage.tsx** : remplacement de l'ancien ancrage EGLD catalogue par un relevé SC historique non payable et clarification de la simulation.
- **DigitalPacksPanel.tsx** : « Mint list » devient « SC · relevé 08/11 » ; CTA « Acheter pack » devient « Découvrir pack » ; correction de la ligne erronée 10 EGLD Pulse.
- **AgentRoster.tsx** : suppression du faux « Floor » calculé à partir de prix catalogue ; indication SC datée et non payable.
- **README, GitBook, release notes** : statuts et prix harmonisés, sans activer d'endpoint financier.

## Risques restant ouverts (P1/P2)

1. **Lisibilité** : des étiquettes et notes de 9–11 px subsistent dans le musée, les packs et le pied de page ; augmenter les textes utiles et vérifier zoom 200 %. La norme WCAG ne se résume pas à une taille minimale en pixels : évaluer contraste, espacement et zoom.
2. **Alternatives texte** : certaines vignettes d'art n'ont pas d'alternative descriptive prouvée lors de cette revue. Vérifier les éléments `img`, `canvas` et leur contexte accessible dans le DOM / lecteur d'écran.
3. **Contraste** : vérifier les libellés secondaires `text-zinc-500/600` sur les fonds sombres, notamment les statuts et les informations de prix ; mesurer des ratios réels dans les deux thèmes avant de conclure.
4. **3D et mouvement** : contrôler le repli 2D, `prefers-reduced-motion`, les focus visibles et la sortie au clavier des scènes immersives.
5. **Responsive** : capturer et tester 375, 390, 414, 768 et 1024 px sur accueil, musée, agents, marketplace, studio, modale et footer ; vérifier les zones tactiles, chevauchements, scroll horizontal et safe-area.
6. **Langues** : vérifier la traduction de tous les nouveaux libellés et l'ordre de lecture pour l'arabe (RTL), plutôt que compter seulement les langues disponibles.

## Définition du GO design

La prochaine validation nécessite **captures récentes**, tests viewport mobile + desktop, un passage clavier/screen reader, des labels et boutons sans ambiguïté, puis une revue contrastes/zoom. Toute déclaration « accessibilité conforme » resterait non étayée aujourd'hui.

Aucune signature, transfert, paiement ni upload n'a été fait pendant cette inspection. 
