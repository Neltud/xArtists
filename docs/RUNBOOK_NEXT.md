# Runbook — suite immédiate

## 1. Frontend (fait en local / à rebuild Pages)

- PageGuide + InfoTip + ScStatusBanner sur : Dashboard, Trading, Wallet, Marketplace, Agents, DAO, Gallery, Portfolio, Hatom, Staking, Tro
- Galerie titre = **xArtists Gallery** (plus Nelson Tuduri en H1)
- Wallet / Portfolio = **LIA treasury** explicite

```bash
cd apps/frontend && npm ci && npm run build
# puis workflow Pages / Actions
```

## 2. P0 on-chain

```bash
# PEM offline, FEE_BPS=300, CHAIN=1
./scripts/preflight_deploy_mainnet.sh
PEM=/path/mainnet.pem ./scripts/deploy_mainnet.sh agents-marketplace
# puis nft-marketplace si codehash à rafraîchir
python scripts/post_deploy_contracts.py --agents erd1...
python scripts/verify_marketplace_codehash.py
```

MAJ `data/contracts.json` + `VITE_*` + rebuild Pages.

## 3. Vellum

```bash
export LIA_LIVE_TRADING=0 CHAIN=1
python -m lia.vellum.pipeline   # v1.3
python -m lia.board.publish
```

## 4. Gates

- Signature user (extension) pour List/Buy — pas wallet LIA ops
- LIA_LIVE_TRADING=1 seulement après micro-trades OK
