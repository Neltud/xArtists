# RWA Escrow Bridge — upgrade P1 (2026-10-16)

Source hardened after [Kevin Lallement MVX exploit note](https://x.com/KevinLallement/status/2111072206767722691).

## Changes in source (not live until upgrade)

1. `openEscrow`: `require!(payer != seller)`
2. `resolveDispute`: wait `DISPUTE_COOLING_SECS` (7 days) after `openDispute`
3. View `getDisputeCoolingSecs`

## Status mainnet

RWA escrow may not be the same address as the nine product SCs in `contracts.ts`.
Confirm deploy address before upgrade. If **not deployed**, prefer fresh deploy of current source over upgrade.

## Build

```bash
cd contracts/rwa-escrow-bridge
# full workspace meta if available:
sc-meta all build
```

## Upgrade (owner machine only — no PEM in CI/chat)

```bash
CONTRACT=<erd1_rwa_escrow>

mxpy contract upgrade "$CONTRACT" \
  --bytecode=output/rwa-escrow-bridge.wasm \
  --pem=/secure/path/owner.pem \
  --proxy=https://gateway.multiversx.com \
  --chain=1 \
  --gas-limit=60000000 \
  --recall-nonce \
  --send
```

## After TX success

1. Fetch new `codeHash`:
   ```bash
   curl -s "https://api.multiversx.com/accounts/$CONTRACT" | jq -r .codeHash
   ```
2. Update frontend expected hash if the contract is gated in `contracts.ts`.
3. Probe:
   ```bash
   python3 scripts/ops_sc_watch.py
   ```
4. Smoke: openEscrow with seller==payer must fail; dispute resolve before 7d must fail.

## Security

- Never commit PEM.
- Pause other product SC only if this upgrade is unrelated to an active incident.
