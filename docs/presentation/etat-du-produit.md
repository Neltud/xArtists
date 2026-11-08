# Disponibilité de xArtists

**Mise à jour : 8 novembre 2026.** Un site accessible, un contrat existant et une transaction commerciale autorisée sont trois choses différentes.

[**Ouvrir le site**](https://neltud.github.io/xArtists/) · [**Voir LIA**](https://neltud.github.io/xArtists/intelligence/lia) · [**Offres**](https://neltud.github.io/xArtists/offres/)

## État actuel

| Domaine | Visite publique | Transaction autorisée ? |
| --- | --- | --- |
| Accueil, Maison, Musée | **Oui** | Pas de paiement nécessaire pour explorer |
| Marketplace | **Découverte** | Non, achats/listings on-chain non certifiés |
| Enchères | **Présentation** | Non, aucune enchère ni adjudication réelle |
| Studio | **Prévisualisation JPG/PNG/WebP/MP4** | Non, upload IPFS et mint réels fermés |
| LIA Control Room | **Snapshots et simulation** | Non, trading autonome désactivé |
| Pulse / Yield / Sentinel | **Catalogue** | Non, livraison NFT non homologuée |
| Whop / TCA | **Information** | Abonnement distinct selon l'offre du partenaire |
| $TRO / Solana | **Informations** | Non, bridge interchaînes fermé |
| xPortal | **Interface de connexion** | Toute transaction exige une signature explicite |

## Prix Genesis et preuves mainnet — 8 novembre

Le catalogue public est **Pulse 110 € / Yield 75 € / Sentinel 50 €**. La dernière lecture documentée de `getPackPrice` donnait **1 / 5 / 2,5 EGLD**, et non les anciens tarifs catalogue ≈ 33 / 22,5 / 15 EGLD. Ce relevé **n'est pas un devis payable**, et la parité fiat/crypto n'est pas démontrée.

Les jetons des trois collections existent sur mainnet, mais les NFT pack indexés ont des **URI média vides**. Les rôles d'ajout d'URI/actualisation ne sont pas attribués au minter. Aucun checkout pack public ne doit être ouvert avant média IPFS vérifié, livraison NFT et droits confirmés.

`isPayable=false` concerne les **transferts directs** : ce flag n'interdit pas à lui seul les paiements à un endpoint explicitement `#[payable("EGLD")]`. Ne pas exiger un upgrade payable-only injustifié. [Preuves et précautions](../ops/AGENTS_PACK_STEP1_READINESS_2026-11-08.md) · [Release 0.130.0](../RELEASE_2026-11-08_PUBLIC.md).

## Données LIA : vérifier la date de la source

L'[agrégateur LIA](https://neltud.github.io/xArtists/data/lia_status.json) publie un **snapshot daté du 3 novembre à 12 h 44 CET** avec le mode paper activé. Le [miroir hub/Vellum](https://neltud.github.io/xArtists/data/lia_hub_status.json) porte encore la date du **7 octobre 2026** : il est obsolète.

La Control Room distingue désormais l'heure de publication, le délai de la source et l'heure de vérification dans votre navigateur. Un tableau qui se rafraîchit ne prouve pas que le fournisseur publie de nouvelles données. Les chiffres shadow sont simulés, jamais des gains réalisés.

## Livraison logicielle versus activation marchande

La dApp v0.130.0 est publiée sur GitHub Pages ; son manifeste public a confirmé le source SHA [`c00f1388`](https://github.com/Neltud/xArtists/commit/c00f13888d88ccfbb05275a4fa7d9f97715ab812) le 8 novembre. La [PR #447](https://github.com/Neltud/xArtists/pull/447) a été fusionnée : vérité tarifaire et verrouillage des ventes packs fiat et crypto. La revue design du 8 novembre a relevé des petits libellés et des estimations EGLD encore présentes sur certaines pages découverte ; leur correction fait l'objet d'une release séparée.

**GO découverte uniquement. NO-GO checkout PayBox, mint NFT réel, enchères et trading.** Les flags techniques du sprint étaient désactivés. Il manque toujours les preuves d'encaissement signé et remboursable, de réconciliation de commande, d'attribution NFT et de livraison finale. L'existence d'un contrat mainnet n'ouvre pas automatiquement tous les usages.

Suivre [#281 — paiement/livraison](https://github.com/Neltud/xArtists/issues/281), [#328 — claim NFT](https://github.com/Neltud/xArtists/issues/328) et [#341 — domaine/contact](https://github.com/Neltud/xArtists/issues/341).

## Contact et transparence

Le domaine xartists.art n'était pas résolu lors des contrôles du 3 novembre. **N'envoyez pas de demande à hello@xartists.art** avant confirmation de la réception. Consultez [les offres et les canaux de présentation](ouverture-demandes-2026-11-03.md), en respectant les avertissements de confidentialité des formulaires publics.

[**Guide mobile**](demarrer-sur-mobile.md) · [**Confiance et transparence**](confiance-et-transparence.md) · [**Code et historique**](https://github.com/Neltud/xArtists)
