# Post-deploy → VITE → rebuild → micro List/Buy

## 1. Deploy (PEM)

```bash
export PEM=/path/mainnet.pem FEE_BPS=300 CHAIN=1
./scripts/preflight_deploy_mainnet.sh
RUN_DEPLOY=1 ./scripts/deploy_optimized_mainnet.sh
```

## 2. Verify codeHash

```bash
python scripts/verify_marketplace_codehash.py
# exit 0 only if BOTH marketplace + agents LIVE
./scripts/post_deploy_to_pages.sh
```

`data/marketplace_codehash_live.json` must show `"ok": true` for both.

## 3. VITE_* + rebuild Pages

Copy from `apps/frontend/.env.mainnet.example` into `deploy-pages.yml`:

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
git push   # deploy-pages.yml
```

Bandeau SC disparaît quand les deux `CODEHASH_OK=1`.

## 4. Micro List/Buy — wallet **user** only

| Interdit | Autorisé |
|----------|----------|
| Session = LIA ops `erd1p4zy…` | Web Wallet / extension de l’artiste ou collectionneur |
| Coller adresse LIA en manuel | Nouveau wallet personnel |

UI : `UserWalletGuard` bloque LIA ops.

Checklist micro :
1. Connect user wallet  
2. List 1 NFT test (prix bas)  
3. Buy depuis un 2e wallet test  
4. Vérifier fee 3 % sur SC + explorer  
5. `claimFees` owner only (LIA ops PEM offline)

## 5. Vellum board cadence

```bash
# Timer Vellum 5–15 min OU cron:
*/10 * * * * cd /path/xArtists && ./scripts/vellum_board_cadence.sh
```

`LIA_LIVE_TRADING=0` jusqu’à micro-trades OK.

## 6. Treasury Mission + Reserve

```bash
mxpy wallet new --format pem --outfile mission.pem
mxpy wallet new --format pem --outfile reserve.pem
# note addresses, store PEM offline
python scripts/set_treasury_wallets.py --mission erd1... --reserve erd1...
# edit docs/TREASURY_POLICY.md table
```

Split fees → Mission / Reserve après premier claimFees.
