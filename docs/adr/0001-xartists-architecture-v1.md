# ADR 0001 — xArtists architecture, design & financial safety (v1)

**Status:** Proposed  
**Date:** 2026-10-19  
**Branch:** `feat/xartists-design-architecture-v1`  
**Context:** Mission Grok — coherent interface + architecture while preserving MultiversX mainnet behaviour; no autonomous live trading.

---

## 1. Context

- dApp Vite/React in **`apps/frontend`** (sole target of `.github/workflows/static.yml`).
- MultiversX mainnet already live for packs, market, staking gates (`scStatus.ts`, runtime codehash).
- LIA Ops wallet is **PAPER by default** (`LIA_LIVE_TRADING=0` / `VITE_LIA_LIVE_TRADING=0`).
- Fiat/Paybox path is **fail-closed** until HMAC session + verified IPN + NFT delivery exist.
- Solana / Jupiter / Paybox autonomous signing must **not** be treated as production execution without a real pre-signature human approval path.

---

## 2. Decision — layered architecture

```
┌─────────────────────────────────────────┐
│  UI (pages, components, i18n, tokens)   │
├─────────────────────────────────────────┤
│  Application services (use-cases)       │
│  - buyPack, listNft, stakeTro, quote…   │
├─────────────────────────────────────────┤
│  Domain                                 │
│  - Order, OrderDigest, RiskPolicy       │
│  - WalletRole (User | LiaOps)           │
│  - ChainId (mvx | sol — never mixed)    │
├─────────────────────────────────────────┤
│  Transport adapters                     │
│  - MultiversX (sdk-dapp / WC)           │
│  - Access-API (Stripe/Paybox session)   │
│  - Optional Solana/Jupiter (opt-in)     │
└─────────────────────────────────────────┘
```

**Rules**

- Domain types are pure TypeScript; no React, no network.
- Application services orchestrate domain + adapters; return typed results.
- UI never calls chain or payment providers directly except through application services (or existing thin libs that will be wrapped).
- **Chain isolation:** a Solana balance must never be displayed or used as a MultiversX balance (and vice versa).

---

## 3. Decision — order state machine

Explicit states for any value-moving intent (swap, pack buy, bid, stake where policy applies):

```
DRAFT
  → QUOTED
  → POLICY_CHECKED
  → AWAITING_HUMAN_APPROVAL
  → APPROVED
  → SUBMITTED
  → CONFIRMED | FAILED | UNKNOWN | HALTED
```

| State | Meaning |
|-------|---------|
| `DRAFT` | User intent, no quote |
| `QUOTED` | Price / route bound; expiry set |
| `POLICY_CHECKED` | Caps, decimals, NaN, wallet role, chain passed |
| `AWAITING_HUMAN_APPROVAL` | Authenticated one-time approval required |
| `APPROVED` | Server-side approval matched exact digest |
| `SUBMITTED` | Broadcast attempted |
| `CONFIRMED` | On-chain success verified |
| `FAILED` | Known failure |
| `UNKNOWN` | **Fail-closed** — no automatic retry of a possibly broadcast order |
| `HALTED` | Kill-switch; resume only via authenticated human action |

**Immutable order digest** binds at least:

- `chainId`
- `walletAddress` (role: User)
- token in / token out (or pack_id / listing_id)
- atomic amount
- slippage bps
- quote id / route fingerprint
- expiry (unix)

Digest is hashed (e.g. SHA-256 over canonical JSON). Approval and audit refer to this digest only. Changing any field invalidates approval.

---

## 4. Decision — wallets and roles

| Role | Who | Default mode |
|------|-----|----------------|
| **User** | Human Connect (xPortal / WC) | Explicit signature per TX |
| **LIA Ops** | Protocol ops wallet | **PAPER only** until gates + micro-proofs + Upbit clarity |

- Never treat an `approver` string or frontend flag as proof of approval.
- Approval must be **authenticated**, **one-time**, **expiry-bound**, and **checked server-side** against the exact digest.
- Paybox `autonomous` signing **cannot** satisfy human confirmation by itself; do not wire it to production execution without a real pre-signature path.

---

## 5. Decision — risk policy (proposed caps)

Caps are **product intent**, not security guarantees, until enforced on a trusted service:

| Cap | Value |
|-----|--------|
| Per order | ≤ 5 USD equivalent |
| Per day (user) | ≤ 15 USD equivalent |
| Slippage | ≤ 50 bps (unless explicit higher opt-in with stronger UX) |

Validation must reject: bad decimals, NaN/Infinity, over-limit, wrong source wallet, missing credential on server paths.

**Not security enforcement:** browser `localStorage` / client JSON ledgers. Audit log + atomic idempotency live on a trusted service.

---

## 6. Decision — financial non-negotiables

1. `LIA_LIVE_TRADING=0` default in env, CI, and deployment.
2. No live swaps in tests or CI.
3. No PEM / seeds / HMAC secrets in Vite frontend (`VITE_*` only public config).
4. Verify TX on-chain; account for fees, balances, concurrent activity — do not infer costs from two equity snapshots alone.
5. Kill-switch: transition to `HALTED`; resume requires authenticated human action.
6. Fiat: server catalog prices only; Paybox/Stripe remain fail-closed until session sign + IPN + mint proven (existing daily safety pass).
7. Main branch remains PAPER for autonomous trading until explicit human review of controls.

---

## 7. Decision — UI / product surface

Preserve xArtists visual identity (soul tokens: graphite `#10120f`, acid `#cdf58b`) and accessibility.

**Hubs (aligned with existing 5 spaces):**

| Space | Hub paths |
|-------|-----------|
| Explore | `/`, `/museum`, `/market` |
| Create | `/studio` |
| Intelligence | `/agents`, `/command-center`, `/lia` |
| Finance | `/staking`, `/lp`, `/dao` |
| Mon espace | `/wallet`, `/portfolio`, `/my-packs` |

Improve: responsive nav, loading / error / empty states. Surface **network**, **risk**, and **TX status**. Never invent balances, yields, prices, or confirmations.

---

## 8. Consequences

**Positive**

- Clear boundary for future Solana/Jupiter without polluting MultiversX UX.
- Fail-closed `UNKNOWN` reduces double-spend risk on ambiguous broadcast.
- Reviewable security story for PR merge to main.

**Trade-offs**

- Order pipeline is more code than “click → broadcast”.
- Caps need server enforcement before claiming hard limits.
- Autonomous Paybox remains disabled for production execution.

**Out of scope for this ADR**

- Enabling live LIA trading.
- Implementing full Stripe/Paybox HMAC + IPN (tracked separately; remain 501).
- Deploying new smart contracts.

---

## 9. References

- `docs/SUITE_LOGIQUE_NOW.md`
- `docs/DESIGN_VALIDATED_DELIVERY.md`
- `docs/ONCHAIN_MICRO_PROOFS.md`
- `docs/ACCESS_PACK_CHECKOUT.md`
- `apps/frontend/src/config/routeRegistry.ts`
- `apps/frontend/src/config/scStatus.ts`
- `.github/workflows/static.yml` (`VITE_LIA_LIVE_TRADING=0`)
