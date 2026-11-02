---
description: >-
  Disponibilité vérifiée le 2 novembre 2026 — site V3 public et mainnet séparé
  du GO commercial.
icon: circle-check
---

# Accès et disponibilité

**Référence : 2 novembre 2026.** Cette page distingue la disponibilité d'un site web, l'existence de contrats déployés, la lecture de données et l'autorisation de traitements commerciaux ou financiers.

## Adresses officielles

| Destination          | Lien                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Site et dApp publics | [neltud.github.io/xArtists](https://neltud.github.io/xArtists/)                                   |
| Musée                | [Immersive Museum](https://neltud.github.io/xArtists/museum)                                      |
| LIA et agents        | [LIA](https://neltud.github.io/xArtists/lia) · [Agents](https://neltud.github.io/xArtists/agents) |
| Guide public         | [GitBook xArtists](https://xartists.gitbook.io/xartists/)                                         |
| Code et historique   | [Neltud/xArtists](https://github.com/Neltud/xArtists)                                             |

## État réel par capacité

| Domaine                         | État au 2 novembre                                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site web / dApp V3              | **En ligne** sur GitHub Pages, dernière publication CI vérifiée                                                                                                         |
| Navigation publique             | Accessible sans wallet ; musée, pages agents, LIA, marketplace de consultation                                                                                          |
| UX mobile                       | PR [#262](https://github.com/Neltud/xArtists/pull/262) fusionnée, Control Room 2D et 3D facultative ; revue mobile matérielle et enregistrements complémentaires prévus |
| LIA                             | **Paper / shadow** par défaut ; l'automatisation du trading LIA Ops n'est pas autorisée                                                                                 |
| Contrats sur MultiversX mainnet | Certains composants sont déployés ; leur existence ne prouve pas la disponibilité de chaque fonction d'achat ou de mint                                                 |
| Packs Genesis                   | Catalogue **110 / 75 / 50 €** ; achat unique, droits durables associés aux SFT ; état de checkout et livraison à vérifier avant encaissement public                     |
| Whop TCA                        | Abonnement **distinct**, services sans SFT Genesis ; disponibilité selon le plan réellement publié                                                                      |
| PayBox                          | Tests automatisés sandbox disponibles ; **aucune preuve de bout en bout d'un encaissement réel + IPN + attribution + remboursement** validée ici                        |
| xPortal                         | Une interface de connexion existe ; test matériel et état des intégrations externes restent à prouver                                                                   |
| Application native              | Aucune publication App Store/Google Play attestée                                                                                                                       |

Les montants EGLD doivent provenir d'un devis serveur valide ou du contrat effectivement interrogé ; les équivalences indicatives d'une carte produit ne sont pas des offres irrévocables.

## Contrôle de production post-fusion — 2 novembre 2026

Après la fusion de la [PR #280](https://github.com/Neltud/xArtists/pull/280), le commit [`15f6f14e`](https://github.com/Neltud/xArtists/commit/15f6f14e551921a4a4a2b1838d2f7e12cd907e50) est déployé sur le service **xartists-access-api** (Render : build et déploiement réussis). Le premier workflow [GO public smoke #41513014908](https://github.com/Neltud/xArtists/actions/runs/41513014908) a **réussi**, contrôlant les pages, les endpoints publics, le mode paper LIA et l'absence d'activation de capacités réservées.

Lecture directe de [`/health`](https://xartists-access-api.onrender.com/health) lors de ce contrôle : `paybox_mode=prod`, `orders_backend=postgres`, `mint_dispatch_enabled=false`, `mint_dry_run=true`, `mint_live_enabled=false`, `lia_live_trading=0`, `tro_solana_bridge=off`, `studio_media_upload=off`, `physical_works=off`. Le fichier [`lia_status.json`](https://neltud.github.io/xArtists/data/lia_status.json) confirme `paper=true` et `LIA_LIVE_TRADING=0`.

**Portée de cette preuve :** disponibilité des surfaces publiques et des garde-fous logiciels au moment du contrôle. **Elle ne prouve pas** un paiement carte réel, un callback IPN confirmé, un mint NFT mainnet, la livraison à l'acheteur ou un remboursement. Ces étapes restent **NO-GO commercial** tant qu'une recette réelle contrôlée et son rapprochement n'ont pas été attestés. Les valeurs ci-dessus sont un instantané daté, pas une garantie permanente.

## Correctif de livraison PayBox — preuve du 2 novembre 2026

La [PR #282](https://github.com/Neltud/xArtists/pull/282), commit [`a98424cd`](https://github.com/Neltud/xArtists/commit/a98424cd7a9e4853c29d57fcb9437f36d7b0fd19), a corrigé un faux état de livraison : après IPN PayBox confirmé, l'API conserve désormais **`delivery=pending`** et **`delivered_at=null`**. Un NFT n'est indiqué comme livré qu'après attestation distincte et éléments corrélés (transaction on-chain, identifiant NFT, horodatage) ; la validation de la chaîne d'attestation reste un travail opérationnel à prouver. Les anciennes lignes `simulated` ne donnent pas de droit de livraison. **My Packs** sépare paiement confirmé, livraison NFT et possession réellement détectée dans le wallet.

Les huit contrôles CI de la PR ont réussi (API, PayBox sandbox, E2E, TypeScript, Rust, audit sécurité, Studio/Physical et $TRO). Le service Render `xartists-access-api` a déployé ce commit avec succès. Le contrôle direct `/health` post-déploiement confirme `mint_dry_run=true`, `mint_live_enabled=false`, `mint_dispatch_enabled=false`, `lia_live_trading=0`, et bridge Solana, Studio et œuvres physiques désactivés.

**Aucun paiement carte réel, mint mainnet, transfert de NFT ni remboursement n'a été effectué au titre de ce correctif.** L'ouverture commerciale reste **NO-GO** jusqu'aux preuves S1/S2/réconciliation. L'[issue P0 #281](https://github.com/Neltud/xArtists/issues/281) suit les tâches restantes. Ces informations sont un instantané daté, pas une garantie de disponibilité permanente.

## À propos des confirmations

Les tests de la PR #262 (Rust, Playwright, audit de sécurité automatisé et fixtures PayBox) et le déploiement GitHub Pages ont réussi. **Cela ne valide ni l'autorisation d'exécuter un ordre autonome, ni un paiement réel, ni un remboursement.**

Le GO marchand requiert au minimum : identité de l'acheteur, devis et montant fiables, preuve PSP signée, liaison d'une seule commande à une seule livraison, état serveur vérifié, contrôle d'idempotence, remboursement et procédure d'arrêt. Pour le trading, un GO distinct est nécessaire.

## Pour les visiteurs

Commencez sans portefeuille ; choisissez une œuvre ou un agent, puis consultez l'état de la fonction voulue. Ne transmettez jamais de phrase de récupération ou de clé privée. Les signaux LIA sont informatifs et ne constituent ni des conseils financiers ni des rendements garantis.

[Présentation](./) · [Guide mobile](demarrer-sur-mobile.md) · [Sécurité](../security/launch-gates.md)
