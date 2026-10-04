# Deployer micro TX + signals

## Proven micro-TX (sandbox)

| Field | Value |
|-------|--------|
| Wallet | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |
| TX | `add9cd5b384bcfa548d8da66156e8fb6ed402cafef4cae428ba8f61a94eff0c9` |
| Type | Self-transfer **0.0001 EGLD** |
| Status | **success** |
| Explorer | https://explorer.multiversx.com/transactions/add9cd5b384bcfa548d8da66156e8fb6ed402cafef4cae428ba8f61a94eff0c9 |

## Signals (`lia/deployer/signals.py`)

- Inputs: EGLD price (API economics), wallet balance, optional force micro-proof
- Outputs: `BUY` / `SELL` / `HOLD` / `MICRO_PROOF` + reason + confidence
- Default: **HOLD** (conservative). Marketplace BUY needs listing + endpoint review before auto-exec.

## Exec (`lia/deployer/micro_exec.py`)

```bash
export DEPLOYER_PEM_PATH=/path/to/deployer.pem
PYTHONPATH=. python -m lia.deployer.micro_exec          # dry-run
DEPLOYER_LIVE=1 PYTHONPATH=. python -m lia.deployer.micro_exec --live
```

PEM never committed. Allowlist tokens: EGLD, USDC-c76f1f, TRO-94c925.

## Next (buy)

Marketplace listing present historically (e.g. ASFT). Auto-buy requires:
1. Read listing price from SC/API
2. Build correct `buy` / ESDT transfer data
3. Cap ≤ Beta 15 USD equivalent
4. Human confirm first on-chain buy
