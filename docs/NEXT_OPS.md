# Next ops — xArtists

## Après ce commit

1. **Rebuild GH Pages** (push déclenche `deploy-pages.yml`)
   - Slim catalog auto (`node scripts/slim_collections.mjs`)
   - Index + `data/collections/{id}.json`
2. Vérifier :
   - `https://neltud.github.io/xArtists/data/xartists_collections.index.json`
   - `https://neltud.github.io/xArtists/data/lia_board.json`
3. **Lighthouse** : Actions → Lighthouse CI (workflow_dispatch)

## P0 produit (bloquant cash)

```bash
# PEM + EGLD sur wallet LIA (~0.16 EGLD dispo — peut nécessiter top-up gas)
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace   # FEE_BPS=300
python scripts/post_deploy_contracts.py --marketplace erd1… --agents erd1…
python scripts/verify_marketplace_codehash.py
# VITE_MARKETPLACE_ADDRESS=… VITE_MARKETPLACE_CODEHASH_OK=1
# VITE_AGENTS_MARKETPLACE_ADDRESS=… VITE_AGENTS_CODEHASH_OK=1
# rebuild Pages → bandeaux SC retirés
```

## P0 UX post-deploy

- Signature wallet réelle (Web Wallet / extension) — pas coller LIA ops
- Micro List / Buy 1 NFT test
- Garder `LIA_LIVE_TRADING=0` jusqu’à micro-trades LIA OK

## P1

- Index listings on-chain (fin ID manuel)
- Studio pin Pinata via backend
- Mission + Reserve wallets treasury

## Vellum cycle

```bash
export LIA_LIVE_TRADING=0 CHAIN=1
python -m lia.vellum.next_run
# commit data/* si reporter ne push pas
```
