# Internal — Mint security model (Sprint 2)

> **INTERNAL ONLY** — do not publish to public GitBook as-is.

## Trust boundaries

| Layer | Trust |
|-------|-------|
| Paybox IPN RSA-2048 | Payment authenticity |
| access-api orders store | Order state machine |
| mint_jobs store | Dispatch idempotency |
| GitHub Actions production env | PEM access |
| MultiversX mainnet | Final NFT ownership |

GitHub 204 ≠ mint success. Only explorer/NFT ownership confirms.

## States (mint_jobs)

`pending → dispatching → submitted → confirmed | failed | reconciliation_required`

- **submitted**: Actions accepted workflow_dispatch
- **confirmed**: human/automation recorded chain_tx + nft id
- **reconciliation_required**: network error mid-flight — **do not** auto re-dispatch

## Gates for live

1. `MINT_DISPATCH_ENABLED=1`
2. `MINT_DRY_RUN=0`
3. `MINT_LIVE_ENABLED=1`
4. `MINT_MAINNET_CONFIRM=LIVE_MINT_MAINNET`
5. Workflow input `live_mint=true` + `confirm=LIVE_MINT_MAINNET`
6. `SC_DEPLOYER_PEM` present in environment production
7. Deployer address matches expected owner

## Residual risk — price window

`setPackPrice(micro)` → `buyPack` → `setPackPrice(Rule1)` is **not atomic**.

Mitigations:
- concurrency group `mint-pack-${pack}` (no cancel-in-progress to avoid half-state)
- Always attempt restore on failure
- Manual check `getPackPrice` after incident
- Prefer funded Rule1 path long-term (no micro window)

## Secrets

- Never log PEM
- umask 077 + delete in `always()`
- No PEM in access-api

## Incident

1. Pause `MINT_LIVE_ENABLED`
2. Query SC prices; restore Rule1 if stuck micro
3. Reconcile `mint_jobs` vs explorer NFTs
4. Manual transfer if buy succeeded, transfer failed
