# Sprint A + B — Operator (Vellum + mainnet agents)

## Sprint A (blocking)

```bash
export PEM=~/wallets/xartists-mainnet.pem   # never commit
export FEE_BPS=300 CHAIN=1
export RUN_SIMULATE=1
./scripts/sprint_a_mainnet.sh

# after simulate gas OK:
export RUN_DEPLOY=1 GAS_LIMIT=<from simulate>
./scripts/sprint_a_mainnet.sh
```

Then blackbox micro 0.01 EGLD — `docs/MAINNET_DEPLOY_BLACKBOX.md`.

Update:

```json
// data/contracts.json
"agents_marketplace": "erd1qqq...",
"fee_bps": 300,
"chain": "1"
```

```bash
# apps/frontend .env / CI secrets
VITE_AGENTS_MARKETPLACE_ADDRESS=erd1qqq...
VITE_AGENTS_FEE_BPS=300
```

Commit addresses only → GH Pages build.

## Sprint B (Vellum)

```text
Secrets: LIA_WALLET_PEM, LIA_LIVE_TRADING=0
Node code:
  from lia.vellum.orchestrator import run_orchestrator
  return run_orchestrator(market={...from DataHub}, publish=True)
```

Pipeline inside orchestrator:

1. bootstrap chain=1  
2. mvx_agent.decide  
3. live_cycle (trailing)  
4. compound health (tp_mode=log)  
5. publish + lia_v6_status timestamp  

Flip `LIA_LIVE_TRADING=1` only after A blackbox green and micro size limits.

## Sprint C (after addresses live)

- /agents Buy via SC  
- fee 3% UI (agentFee.ts + VITE_AGENTS_FEE_BPS)  
- Trading streak from lia_compound_streak.json  

## Sprint D

- soul-zk-verifier deploy optional  
- no SOL/HL execution  
