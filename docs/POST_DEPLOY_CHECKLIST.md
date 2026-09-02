# Post-deploy checklist

> Suite immédiate après `./scripts/runbook_deploy.sh verify`  
> Runbook complet: [`RUNBOOK_DEPLOY.md`](RUNBOOK_DEPLOY.md)

## 1. Verify OK

```bash
./scripts/runbook_deploy.sh verify
# data/marketplace_codehash_live.json → all_ok: true
```

## 2. VITE + Pages

Copier depuis `apps/frontend/.env.mainnet.example` vers `deploy-pages.yml`:

```yaml
VITE_MARKETPLACE_ADDRESS: erd1...
VITE_MARKETPLACE_CODEHASH_OK: "1"
VITE_AGENTS_MARKETPLACE_ADDRESS: erd1...
VITE_AGENTS_CODEHASH_OK: "1"
VITE_AGENTS_FEE_BPS: "300"
```

```bash
git add data/contracts.json data/marketplace_codehash_live.json
git commit -m "ops: SC live + codehash"
git push
```

## 3. Micro List/Buy — wallet user only

| Interdit | Autorisé |
|----------|----------|
| LIA ops `erd1p4zy…` | Web Wallet / extension perso |

1. Connect user  
2. List 1 NFT test  
3. Buy depuis 2e wallet  
4. Fee 3 % on-chain  
5. claimFees = owner PEM offline  

## 4. Vellum cadence

```bash
./scripts/vellum_board_cadence.sh   # LIA_LIVE_TRADING=0
```

## 5. Treasury Mission + Reserve

```bash
mxpy wallet new --format pem --outfile mission.pem
mxpy wallet new --format pem --outfile reserve.pem
python scripts/set_treasury_wallets.py --mission erd1... --reserve erd1...
```
