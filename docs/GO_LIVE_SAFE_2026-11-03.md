# GO LIVE (safe) — 2026-11-03

**Historical snapshot (2026-11-03), not a current production attestation.** Public browsing may be offered only when the deployed SHA, routes, assets and runtime health are verified again. No automatic commercial GO.  
**Hard NO:** non-atomic mainnet mint (#310), open checkout without S1 playbook, LIA trading, Solana bridge.

## What is LIVE now (measured)

| Surface | Status |
|---------|--------|
| GitHub Pages dApp | **LIVE** |
| Packs / Museum / Command / TRO discovery | **LIVE** (read) |
| LIA signals / lia_status paper | **LIVE** |
| access-api Render | **LIVE** |
| PayBox PSP **configuration** | **Configured at the historical check; not a verified settlement or authorization to charge** |
| PayBox **checkout session** | **OFF** (`paybox_checkout_enabled=false`) |
| OIDC mint **dry-run pull** | **ON** |
| Manual/auto **live mint** | **OFF** (#310 hard deny) |
| LIA trading | **OFF** |
| TRO Solana bridge | **OFF** |

## What “GO LIVE” does **not** mean

- Not “card payment open to the public” until `PAYBOX_CHECKOUT_ENABLED=1` **and** refund + support staffing.
- Not “NFT on payment” — paid ≠ delivered (#282).
- Not “deployer funded ⇒ mint” — live workflow refuses non-atomic path.

## Checkout release gate (future, separate human approval)

**Do not enable checkout from this runbook.** Before any public charge: prove the actual Render-bound production database and atomic S1 order/IPN ledger, test signed PSP settlement and replay/refund, prove S2 on-chain NFT ownership and delivered-at reconciliation, establish customer support and refund operations, verify current deployed frontend, obtain independent security review and a distinct signed operator GO (#281/#328). A feature flag or merchant credentials alone are never enough.

## Mint mainnet later (separate engineering GO)

Requires **atomic** pack purchase (no admin `setPackPrice` window) **or** explicit written acceptance of residual risk + funded deployer + re-enable path under new PR (not a silent revert of #310).

## Public copy (allowed)

- “xArtists offers a public packs preview and paper-only LIA snapshots; verify availability on the deployed build.”
- “Payment provider integration is being validated; public checkout is currently closed.”
- “Mint delivery is gated; payment never auto-delivers NFT.”

## Public copy (forbidden)

- “Buy and receive your NFT instantly.”
- “Live on-chain mint enabled for all buyers.”
- “LIA trades for you.”
