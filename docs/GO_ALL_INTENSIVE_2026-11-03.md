# GO ALL intensive — decision record 2026-11-03

## Ask

> Go live mint · Go all · deep work

## Decision

| Request | Verdict |
|---------|---------|
| Re-enable `live_mint` / load PEM / setPackPrice window | **REJECTED** (#310) |
| Public dApp + signals + API + OIDC dry-run as “live” | **ACCEPTED** |
| Design atomic successor | **IN PROGRESS** → `ATOMIC_MINT_ROADMAP.md` |
| Checkout / LIA trade / bridge | **NO** without separate GO |

## Rationale

Shipping a known non-atomic sale window under “GO LIVE” would convert a controlled product into an open low-price race against our own SC. Funding the deployer does not fix that design flaw.

PEM present in GitHub is necessary for a *future* safe workflow, not permission to run the blocked job.

## Immediate backlog (safe intensity)

1. Keep #310 locks
2. Atomic SC / claim design review
3. Refund + marketing claims docs
4. Optional: one-time **manual** Rule1 `setPackPrice` only when deployer funded — **outside** payment automation, single admin tx, not per-order
5. Testnet prototype of path A or B before mainnet workflow re-enable PR

## Explicit non-actions this record

- No workflow `if: true` on live mint job
- No PEM read/export
- No mainnet buyPack from automation
