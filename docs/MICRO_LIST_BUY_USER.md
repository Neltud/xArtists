# Micro List / Buy — wallet **user** (pas LIA)

**Objectif** : prouver E2E List + Buy avec un wallet collectionneur/artiste, après SC live.

## Prérequis (bloquants)

1. `nft-marketplace` déployé mainnet, **codeHash ≠ null**
2. `python scripts/verify_marketplace_codehash.py` OK
3. `data/contracts.json` + `VITE_MARKETPLACE_ADDRESS` + `VITE_MARKETPLACE_CODEHASH_OK=1`
4. Rebuild GH Pages
5. `LIA_LIVE_TRADING=0` (indépendant du market user)

## Signature (P0)

| Méthode | TX List/Buy ? |
|---------|----------------|
| xPortal / WC | Oui si `__xartistsSendTx` injecté (TxShell) |
| DeFi Wallet extension | Oui (recommandé micro-test) |
| Web Wallet redirect | Oui si callback + sdk-dapp |
| **Coller erd1** (`paste_readonly`) | **Non** — lecture seule |
| Wallet LIA ops | **Non** — bloqué UI |

## Procédure micro (user)

1. Ouvrir `/marketplace` (charge TxShell → `bootstrapSendTx`)
2. Connect **extension** ou Web Wallet — vérifier badge vert « Signature prête »
3. **List** : NFT détenu par le user → Sell → prix 0.01 EGLD → confirmer wallet
4. Noter `listingId` (index ou explorer events)
5. Second wallet (ou même si rebuy autorisé) → **Buy** avec listingId + value exacte
6. Explorer : NFT ownership + fee balance SC

## Interdits

- Signer avec PEM LIA depuis la dApp
- Envoyer EGLD vers l’ancienne adresse empty account
- Afficher succès si `sessionId` null / error sign

## Après succès

- Retirer bandeaux P0 market
- Activer index listings (`data/listings_index.json`)
- Documenter tx hashes dans `DEPLOYMENT_LOG.md`
