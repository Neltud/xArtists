# Suite logique — exécution (Vite stack)

## 1. Rebuild GH Pages
Push `main` → workflow Pages. Vérifier:
- Barre **Guardian** globale (SAFE / … / KILLED)
- `/dao` : split 40/30/20/10 + burn feed
- `/marketplace` : EscrowTimeline (UI only)

## 2. Vellum status
```bash
export CHAIN=1 LIA_LIVE_TRADING=0 PYTHONPATH=.
python -m lia.vellum.production_run
```
→ `lia_v6_status.json` avec `guardian.kill_state` (ex. ARMED)

## 3. DAO + burn feed
- `TreasurySplitViz` + `TroBurnFeed`
- JSON: `data/tro_burn_feed.json` (events vides OK)

## 4. Deploy SC (goulet — PEM + EGLD)
```bash
export PEM=/secure/mainnet.pem FEE_BPS=300 CHAIN=1
# wallets Mission/Reserve/Reward/Ops d’abord pour splitter
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace
python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...
python scripts/verify_marketplace_codehash.py
# puis ./scripts/deploy_treasury_splitter.sh
```
**Pas de LIVE trading** tant que codeHash null + micro-proofs = 0.
