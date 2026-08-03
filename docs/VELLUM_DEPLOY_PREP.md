# Préparation déploiement Vellum

```bash
export LIA_LIVE_TRADING=0
export CHAIN=1
export FEE_BPS=300
export PEM=/secure/mainnet.pem   # never git

# Optional later
# export PINATA_JWT=...

./scripts/simulate_deploy_mainnet.sh
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace

python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...
python scripts/verify_marketplace_codehash.py   # must be non-null

python -m lia.vellum.next_run
# push data/*.json
# GitHub Actions deploy-pages
```

Gates: `python -m lia.decisions.policy`
