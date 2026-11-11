# xArtists — Phase A MultiversX Marketplace — sprint suivant (11 novembre 2026)

**Décision : conserver le contrat NFT Marketplace LIVE déjà déployé. Pas de redéploiement, d'upgrade, de signature ou de transaction dans ce lot.**

## Vérité vérifiée (lectures publiques le 11/11)

| Élément | Résultat |
|---|---|
| Réseau | MultiversX mainnet / chain ID `1` |
| Marketplace SC | `erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm` |
| Source registre | `data/contracts.json` / `addresses.nft_marketplace` |
| codeHash live | `8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc=` |
| CodeHash registre | **identique** au live |
| Code déployé | présent (WASM non vide) |
| `isPayable` | **true** sur API publique |
| CodeMetadata gateway | `BQY=` |
| Owner du contrat | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |
| Dépôt SFT visible | `ASFT-a6273a-01`, balance 1 sur le SC au relevé |
| Balance SC | `0.0175 EGLD` au relevé — **pas le prix d'un listing** |

Requêtes primaires publiques :
- `https://api.multiversx.com/accounts/<SC>` (codeHash, payable, owner)
- `https://gateway.multiversx.com/address/<SC>` (CodeMetadata)
- `https://api.multiversx.com/accounts/<SC>/nfts?size=10`
- Vue read-only `POST https://gateway.multiversx.com/vm-values/query`, `getListing`, `getFeeBps`, `isPaused`.

L'ancien fichier `data/marketplace_codehash_live.json` pointe à l'adresse placeholder `…8354t` (août 2026). **Ne pas le traiter comme verdict du contrat live**. Le registre `data/contracts.json` est la référence actuelle, à réconcilier avec le réseau avant chaque action.

## ABI / endpoints applicatifs réels

`contracts/nft-marketplace/src/lib.rs` et `packages/core/src/contracts/marketplaceAbi.ts` exposent :

| Opération | Entrées | Valeur envoyée | Conditions principales |
|---|---|---|---|
| `listNft` | price (BigUint), royalty_bps (u16), receiver (Address) | Transfert ESDTNFT de **1 unité** au contrat, pas un EGLD brut | propriétaire-signataire, prix positif, fee + royalties ≤ 1000 bps, pause=false |
| `buyNft` | listing_id (u64) | montant **EGLD** >= prix on-chain frais | listing actif, contrat payable, règlement vendeur et NFT vers acheteur |
| `placeBid` | listing_id | dépôt EGLD > 0, supérieur au précédent | listing actif et non pausé |
| `acceptBid` | listing_id | 0 EGLD | vendeur, offre valide, transfert vers bidder |
| `withdrawBid` | listing_id | 0 EGLD | bidder déposant |
| `cancelListing` | listing_id | 0 EGLD | seller / owner, retour du NFT et remboursement éventuel des bids |
| `getListing`, `getBid`, `getFeeBps`, `isPaused` | view args | **0 EGLD** | interrogation sans signature |

Le SC **ne dispose pas** d'une fonction `offer` universelle distincte : `placeBid` est la fonction d'offre au sens économique.

## Preuves historiques indépendantes déjà visibles sur la chaîne

- **Achat historique réel réussi** (listing #1) : `57b7b5e2e9102b7a715c9e08a602afd070b1861098b7d4baf4ab5edab801806e`, `buyNft` / `0.25 EGLD`, `status=success` avec évènement `ESDTNFTTransfer` émis par le SC. [Explorer](https://explorer.multiversx.com/transactions/57b7b5e2e9102b7a715c9e08a602afd070b1861098b7d4baf4ab5edab801806e).
- **Bid historique réel réussi** (listing #2) : `02b3497187f70d6435060216cbac18b4b34f7bde71b8f148e3dccd8a5f7cde89`, `placeBid` / `0.01 EGLD`, `status=success`, `placeBid` log. [Explorer](https://explorer.multiversx.com/transactions/02b3497187f70d6435060216cbac18b4b34f7bde71b8f148e3dccd8a5f7cde89).
- Upgrade de metadata `d6312b6ae187351a4f45c4b1351fa9f8678dabc2f688237ff559edf6d0c27ce7`, succès historique et `isPayable=true` confirmé au 11/11.

Ces preuves établissent que le **bon contrat** fonctionne historiquement. Elles ne prouvent **pas** l'état actuel de `getListing(2)`, le solde d'un wallet acheteur futur ou une nouvelle vente complète après cette date. L'étiquette « payable » n'est pas une permission commerciale.

## Livrable du lot read-only

- Script : `node scripts/ops/inspect-marketplace-mainnet.mjs` — refuse toute divergence codeHash / mauvais réseau, interroge le SC, `isPaused`, `getFeeBps`, puis `getListing(1..8)`. Jamais de signature, mutation ou paiement.
- Tests simulés : `node --test scripts/ops/inspect-marketplace-mainnet.test.mjs`, dont cas #1 inactif / #2 actif, view indisponible, hash divergent, payload corrompu et adresse legacy.
- **Source SDK read-only** : `apps/frontend/src/lib/marketChain.ts` fournit un décodeur historique ; vérifier la forme exacte de l'endpoint via tests live avant de l'utiliser pour activer l'UI d'achat. La galerie publique garde des cartes d'exposition / dépôt **sans bouton Acheter fictif**.

## Exit Phase A — preuve d'une *nouvelle* vente complète

1. **Read-only** — lister les endpoints, vérifier codeHash, `isPaused=false`, les rôles NFT, `getListing(id).active=true`, identifiant token, nonce, prix exact et wallet seller avant construction TX.
2. **Préparation UI** — montrer Acheter uniquement pour le listing ID attesté par une vue chaîne fraîche et un wallet utilisateur signé ; aucune autorisation issue d'un JSON d'index, d'un prix affiché, d'un flag env seul ou de localStorage.
3. **Micro-vente contrôlée** — signer `ESDTNFTTransfer@...@listNft` par le wallet propriétaire, puis `buyNft@<id>` par un **wallet acheteur différent**, avec prix exact et gas. Aucune clé/secrets partagés dans GitHub/ChatGPT. Exécution seulement après revue opérateur distincte du montant et de l'œuvre.
4. **Réconciliation** — vérifier statuts finalisés, logs et transferts, NFT `collection-nonce` au wallet acheteur, état de listing inactif, règlement vendeur/royalties, absence de double débit et hash Explorer des 2 transactions.
5. **ACTIVE_CONTEXT** — y reporter **uniquement** les hash réellement émis et la preuve de possession acheteur après vérification publique.
6. **GO commerce** — décision **séparée**, non déduite du micro-test.

## Rails fermés

- LIA `LIA_LIVE_TRADING=0`, jamais de session de trading autonome ou de recharge du hot wallet.
- PayBox / Stripe public, packs NFT mint automatique, TON runtime et autres chaînes hors scope.
- Aucun achat, broadcast ou appel sensible dans les scripts CI de cette phase.
