# Vellum — run now (LIA)

## Secrets

```
FORCE_MODE=paper
LIA_PEM_* (never in git)
MX_GATEWAY=https://gateway.multiversx.com
MX_API=https://api.multiversx.com
ALLOW_DEPLOY=false
SOUL_ENABLED=testnet
```

## Repo paths for Vellum

- `config/protocols.json`
- `docs/LIA_DEFI_ORCHESTRATOR.md`
- `docs/AGENTS_REGISTRY.md`
- `lia/executor/universal_executor.py` + patch PEM
- `nodes/rewards_agent.py`, `nodes/swarm_*.py`
- `lia/agents/green_smoke_consumer.py`

## Ordered mission

1. FORCE_MODE=paper
2. Apply UniversalExecutor PEM signature (no literal swap string)
3. Swarm + RewardsAgent paper cycle
4. GreenSmokeConsumer → opportunities score
5. Hatom supply only if HF + idle USDC rules pass
6. No Soul mainnet; no user PEM in UI

## Frontend wallet (separate from LIA PEM)

User: xPortal / Web Wallet / DeFi extension via sdk-dapp + WalletContext.  
LIA: PEM secret in Vellum only.
