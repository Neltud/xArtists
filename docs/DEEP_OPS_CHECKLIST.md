# Deep ops checklist — xArtists

## A. Data / Pages
```bash
./scripts/ensure_pages_data.sh
PYTHONPATH=. python -m lia.oracles.publish
PYTHONPATH=. python -m lia.board.publish
PYTHONPATH=. LIA_LIVE_TRADING=0 CHAIN=1 python -m lia.vellum.pipeline
```

## B. SC mainnet (PEM + EGLD)
```bash
./scripts/deploy_mainnet.sh agents-marketplace
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_tro_burn.sh
python scripts/post_deploy_contracts.py --agents erd1... --marketplace erd1... --tro-burn erd1...
python scripts/verify_marketplace_codehash.py
# TRO: ESDTLocalBurn + fundRewards
```

## C. Env front
VITE_* + CODEHASH_OK=1 only after verify · rebuild Pages

## D. Gates
```bash
PYTHONPATH=. python -m lia.security.go_live_gates
```
LIVE only if micro_proofs ≥ 1 and codeHashes OK.

## E. Honesty
PrivateReleaseStrip · AgentsDeployStatus · Burnify quote = estimate · Wallet ≠ Portfolio · Packs ≠ GSN
