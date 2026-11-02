# GO Live — Pack mint MAINNET armed (2026-11-02)

## Operator decision

- **Live mint = true** — authorized
- **Live mainnet = ok** — authorized
- **No smoke gate** required by operator for mint path
- **LIA trading** remains `VITE_LIA_LIVE_TRADING=0` (paper) unless separately lifted

## Runtime

| Item | Status |
|------|--------|
| Release | 0.127.0+ |
| GenesisCard3D / PackLanding / My Packs | live on Pages |
| Collections | XAIPLS-2cf72b · XAIYLD-987e24 · XAISNT-3d8a6b |
| SC packs | `erd1qqqq…gdqwsg` |
| Workflow | `mint-on-payment.yml` default **live_mint=true** |
| Confirm string | `LIVE_MINT_MAINNET` |
| Secret | `SC_DEPLOYER_PEM` in env **production** |
| Prices Rule1 | Pulse 33 · Yield 22.5 · Sentinel 15 EGLD |

## Dispatch live mint

Actions → **Mint on payment (LIVE mainnet armed)** → Run workflow:

| Input | Value |
|-------|-------|
| pack | pulse \| yield \| sentinel |
| edition | label only (metadata) |
| buyer | `erd1…` recipient |
| live_mint | **true** |
| confirm | **LIVE_MINT_MAINNET** |

Flow: setPackPrice Rule1 → buyPack (deployer pays) → ESDTNFTTransfer → buyer.

## Notes

- Deployer must hold enough EGLD (price + gas).
- PEM never logged; cleaned in `always()`.
- TCA Whop membership still **does not** mint.
- Fiat IPN → auto-dispatch can be wired next (access-api webhook → workflow_dispatch).
