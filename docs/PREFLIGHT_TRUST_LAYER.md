# Pre-Flight Trust Layer (P0 / P1)

**Phase** : infrastructure before user money (packs deposits / market volume).  
**Réseau** : MultiversX mainnet only.

---

## Task 1 — Deploy & CodeHash (P0)

### Local fingerprint (before deploy)

```bash
./scripts/build_scs_isolated.sh agents-marketplace
./scripts/build_scs_isolated.sh nft-marketplace
python3 scripts/codehash_protocol.py --contract nft-marketplace --contract agents-marketplace
# → data/codehash_manifest.json (SHA-256 wasm)
```

### Real deploy (needs PEM + EGLD)

```bash
export PEM=/path/mainnet.pem
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0
./scripts/runbook_deploy.sh dry      # 0 txs
./scripts/runbook_deploy.sh deploy  # sends deploy txs
./scripts/runbook_deploy.sh verify  # codeHash live + report
```

Pipeline interne : `deploy_optimized_mainnet.sh` → `post_deploy_contracts.py` → `verify_marketplace_codehash.py`.

### Frontend verification

| Flag | Meaning |
|------|---------|
| `VITE_MARKETPLACE_CODEHASH_OK=1` | API `codeHash` non-null for market SC |
| `VITE_AGENTS_CODEHASH_OK=1` | same for agents |

Gates : `apps/frontend/src/config/scStatus.ts`, `ScStatusBanner`, `useMarketplaceTx` — **no Buy until OK**.

On-chain MultiversX already exposes account `codeHash` via API ; we do **not** invent a separate “emit event” unless a dedicated registry SC is added later. Verification = **API codeHash + optional local wasm SHA256 audit trail**.

---

## Task 2 — Treasury 4 wallets (P0)

| Slot | Role |
|------|------|
| **Mission** | Grants, art |
| **Reserve** | Runway |
| **Reward** | Pack pool / incentives |
| **Ops** | = `lia_ops` (execution) |

```bash
./scripts/preflight_trust_layer.sh treasury
# after mxpy wallet new:
python scripts/set_treasury_wallets.py --mission erd1… --reserve erd1… --reward erd1…
```

JSON : `data/treasury_wallets.json` — PEM never in git.

---

## Task 3 — Paper multi-capital (P1)

```bash
python3 scripts/simulate_multi_capital_ledger.py
# → data/simulated_ledger.json
```

1 signal LIA → filter packs → ticket sizes → ledger PnL paper.  
Source : `lia/agents/multi_capital_router.py`.

---

## One-shot preflight (0 deploy txs)

```bash
chmod +x scripts/preflight_trust_layer.sh
./scripts/preflight_trust_layer.sh all
```

## Real money path (ordered)

1. Preflight all green (wasm built)  
2. Mission/Reserve/Reward addresses published  
3. `runbook_deploy.sh all`  
4. `verify` → `all_ok`  
5. VITE_* + rebuild Pages  
6. Micro List/Buy **user** wallet  
7. `LIA_LIVE_TRADING=0` until micro OK  

*No pack user deposits until agents SC live + model C or escrow B documented.*
