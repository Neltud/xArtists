---
description: >-
  Version publique xArtists 0.130.0, état mainnet et périmètre de commercialisation du 8 novembre 2026.
---

# Release publique — xArtists v0.130.0 (8 novembre 2026)

**Canal :** application publique GitHub Pages. **Périmètre :** découverte et aperçu ; **pas** de lancement financier ou NFT payant.

## Publication contrôlée

- Version affichée dans le manifeste de production : **0.130.0**.
- Source SHA vérifié dans `/build-info.json` : [`c00f13888d88ccfbb05275a4fa7d9f97715ab812`](https://github.com/Neltud/xArtists/commit/c00f13888d88ccfbb05275a4fa7d9f97715ab812).
- [GitHub Pages](https://neltud.github.io/xArtists/) et [rapport de déploiement](https://github.com/Neltud/xArtists/actions/runs/42513747165) : publication réussie. Le manifeste public indiquait `lia_live_trading=false`.
- [PR #447](https://github.com/Neltud/xArtists/pull/447) : correctif des pages de checkout, tarification informative distincte des cotations, refus d'ouverture commerciale.
- Le présent lot de docs/UX est **postérieur** au déploiement ci-dessus ; il ne modifie pas le numéro de version sans automatisation de release dédiée.

## Ce qui fonctionne

Le public peut découvrir les œuvres, le musée, les parcours de création, les fonctionnalités annoncées et les salles/intelligences en mode présentation. Aucune connexion wallet n'est requise pour visiter. La navigation comprend une recherche globale, un thème clair par défaut (en l'absence de préférence enregistrée), un mode sombre facultatif et une documentation publique.

## Ce qui n'est pas autorisé

| Module | Parcours de découverte | Opération réelle |
| --- | --- | --- |
| Musée / œuvres | Accessible | Les fiches ne prouvent pas toutes les données de provenance |
| Studio / IPFS | Aperçu local | Upload Pinata et mint réel non ouverts au public |
| Marketplace / enchères | Catalogue / découverte | Achat, mise en vente et adjudication non homologués |
| Genesis Pulse / Yield / Sentinel | Catalogue 110 / 75 / 50 € | **Paiements fiat et EGLD fermés ; NFT non livrés** |
| LIA | Snapshots / paper | Trading autonome OFF |
| $TRO / Solana | Informations | Bridge réel non activé |

## Vérité on-chain des packs — relevé du 8 novembre

| Pack | Collection | `getPackPrice` observé | Catalogue fiat |
| --- | --- | ---: | ---: |
| Pulse | `XAIPLS-2cf72b` | **1 EGLD** | **110 €** |
| Yield | `XAIYLD-987e24` | **5 EGLD** | **75 €** |
| Sentinel | `XAISNT-3d8a6b` | **2,5 EGLD** | **50 €** |

Les prix ci-dessus sont un **relevé daté** et ne constituent ni un cours de conversion ni une cotation payable. Les NFT de ces collections déjà indexés ont des **URI média vides** et montrent une miniature de remplacement. Aucun droit URI/update n'a été observé sur les collections pour le minter. Il faut résoudre média IPFS, preuve de livraison, provenance et cohérence du devis avant une vente publique.

**Rectification technique :** `isPayable=false` concerne les transferts EGLD directs à un contrat, pas nécessairement les appels à un endpoint `#[payable("EGLD")]`. Un upgrade payable-only ne corrigerait pas les URI vides. [Référence MultiversX](https://docs.multiversx.com/developers/developer-reference/sc-payments/).

## Revue d'expérience & priorités

Le parcours desktop public sans wallet a été inspecté sur accueil, musée, agents et marché. Les forces sont la découverte sans portefeuille, les statuts « Preview only », le moteur de recherche, le choix de langue et les chemins de navigation. Un défaut P0 de transparence a été observé : certaines pages de présentation utilisaient encore les anciens prix ≈ 33 / 22,5 / 15 EGLD. Le correctif post-release retire ces montants de ces vues et conserve l'indication explicite « vente fermée ».

Voir [Revue design — 8 novembre](presentation/revue-design-2026-11-08.md) pour les risques de lisibilité, d'alternatives d'images et les contrôles mobiles encore à faire.

## Vérifications requises pour la prochaine publication

- Build + TypeScript + tests de contrats UI/UX, chemins et sécurité sur la PR de mise à jour.
- Manifeste public avec SHA de commit **après** fusion et déploiement GitHub Pages.
- Relecture de GitBook et de ses liens après fusion : préserver le `SUMMARY.md`, les blocs et le frontmatter.
- Contrôle mobile manuel 375/390/414 px, clavier et screen reader sur les parcours majeurs.
- Ne jamais confondre publication d'interface avec ouverture des paiements.

**Statut : GO contenu public, NO-GO commerce packs et trading.**
