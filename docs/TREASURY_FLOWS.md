# xArtists — Treasury & money flows

**Date:** 2026-08-02  
**Source of truth on-chain:** `contracts/agents-marketplace/src/lib.rs`

Three cash circuits must not be mixed in the UI or in LIA accounting.

---

## Circuit B — Agents marketplace (limited packs)

### On buy (`buyAgentAction`)

Buyer sends **EGLD** ≥ listing price.

| Share | Formula | Destination |
|-------|---------|-------------|
| **Seller (net)** | `price − fee` | `listing.seller` via `direct_egld` (immediate) |
| **Protocol fee** | `price × fee_bps / 10_000` | **Stays on the smart contract** balance |

- `fee_bps` set at `init` (e.g. **300 = 3%**, max 1000 = 10%).
- Listing is set `active = false` after a successful buy.
- No agent royalties, no TRO burn on agent buy (v1).

### Numeric example (`fee_bps = 300`)

| Item | EGLD |
|------|------|
| List price | 1.000 |
| Protocol fee (3%) | 0.030 |
| Seller receives | 0.970 |

### Who is the seller?

| Lister | Net goes to |
|--------|-------------|
| LIA (Vellum `listAgentAction`) | LIA wallet `erd1p4zyy…` |
| Third-party / artist | Their address |

### Protocol fee treasury

Fees accumulate as **EGLD balance of the agents-marketplace contract**.

- **Claim:** endpoint `claimFees` — **owner only** (deployer set at `init`).
- Owner withdraws full contract EGLD balance to owner address.
- Until claimed, fees are locked in the SC (transparent, auditable).

### Views

| View | Purpose |
|------|---------|
| `getFeeBps` | Current fee in basis points |
| `getContractEgldBalance` | EGLD held as protocol treasury |
| `getListing(id)` | seller, agent_id, price, active |

### Frontend must show

Before Buy:

> You pay **P** EGLD · Protocol fee **X%** (~fee) · Creator receives **P − fee**.

Config hint: `VITE_AGENTS_FEE_BPS=300` until on-chain view is wired.

**Agent sale proceeds do not enter LIA compound 70/30** — that is Circuit C only.

---

## Circuit A — NFT marketplace

```
Buyer → buyNft (EGLD)
  → fee_bps → NFT marketplace SC treasury
  → net → artist (seller)
  → royalties % on secondary → artist
  → [GAP] burn $TRO on sale — not implemented yet
Tip EGLD/BTC → artist (off marketplace SC)
```

See also `docs/LACUNES_PRODUIT.md`.

---

## Circuit C — LIA trading wallet only

Wallet LIA operational funds (not agent marketplace fees):

```
WIN PnL $P
  70% → compound_equity (re-trade)
  30% → yield_sleeve (Hatom / LP / stake EGLD)

TRO received → never hold:
  40% LP · 30% stake · 20% rewards · 10% burn
```

Details: `docs/CIRCUIT_FINANCIER_PRO.md`.

---

## Summary table

| Flow | User pays | Seller net | Protocol | LIA compound? |
|------|-----------|------------|----------|---------------|
| B Agents | EGLD price | price − fee | fee on SC → claimFees(owner) | No |
| A NFT | EGLD (etc.) | net after fee | NFT SC fee | No |
| C Trade PnL | n/a (LIA wallet) | n/a | n/a | Yes 70/30 |

---

## Gaps

| ID | Issue | Status |
|----|-------|--------|
| G3 | agents_marketplace address null until deploy | Open — Vellum deploy |
| G6 | claimFees missing | **Closed in SC source** (this commit) — needs redeploy |
| — | Frontend fee split on /agents | Documented; wire UI to VITE_AGENTS_FEE_BPS |
| — | Burn TRO on NFT sale | Open |

*xArtists / LIA — 2026-08-02*
