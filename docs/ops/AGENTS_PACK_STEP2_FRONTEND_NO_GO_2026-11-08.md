# Étape 2 — Frontend / pricing : gate fail-closed (2026-11-08)

**PREP ONLY. No signing, broadcast, upgrade, buyPack, merge or deployment.**

Base: `docs/ops/AGENTS_PACK_STEP1_READINESS_2026-11-08.md` and `AGENTS_PACK_PRICE_MATRIX_2026-11-08.json`. Chain price snapshot captured at `2026-11-08T18:40:00Z` (not a continuously refreshed quote).

## Findings

- UI catalogue `AGENT_PACKS.priceEgld.list` contained **33 / 22.5 / 15 EGLD**, distinct from SC `getPackPrice` **1 / 5 / 2.5 EGLD**; those anchors cannot fund `buyPack`.
- EUR catalogue **110 / 75 / 50 EUR** is a separate fiat product/pricing rail. No spot EGLD conversion or fiat entitlement should be inferred.
- `canBuyAgent()` previously required codehash and address only, not on-chain `isPayable` or media/URI evidence. `buyPack` creates empty URI vectors on deployed code.
- Deployed contract is **isPayable=false** for **direct transfers** (re-read via mainnet API); this does **not** by itself disallow a `#[payable("EGLD")]` endpoint. See https://docs.multiversx.com/developers/developer-reference/sc-payments/. No payable-only upgrade required to fix `buyPack`.

## Changes on PREP branch

1. `scStatus.ts`: explicit `AGENT_PACK_PUBLIC_MINT_RELEASED=false` and mandatory gate in `canBuyAgent`. Every existing caller (including `useAgentPackTx`) remains blocked.
2. `agentPacks.ts`: named historical SC snapshot, not a quote, preserving catalog EUR and EGLD anchors for non-transactional context.
3. `PackCheckout.tsx`: displays historical observed SC prices with date and NO-GO qualifier rather than EGLD catalog anchors.
4. `CheckoutModal.tsx`: crypto rail disabled while `canBuyAgent` false; hides transactional-looking static anchor, enforces disabled continuation. Fiat commercial readiness remains **independent**, unchanged.
5. Regression test: `apps/frontend/tests/pack-mainnet-prep-no-go.test.mjs` checks visible PREP boundary.

## Required independent validation (not yet performed in this PREP step)

- CI: `cd apps/frontend && npm ci --legacy-peer-deps && npm run test:release && npm run typecheck && npm run build`.
- Fresh chain `accounts/{agentsSc}` and `getPackPrice` retested for three packs. Do **not** demand `isPayable=true` as a precondition for an EGLD payable endpoint; it only governs direct transfers.
- Rights-cleared artwork and metadata → content-addressed IPFS upload and independent gateway exact-byte readback.
- Contract upgrade review for create-time nonempty URI OR owner-signed token URI role assignment / existing nonce repair. **Owner wallet only.**
- Controlled owner micro-test, receipt and NFT metadata verification, followed by separate commercial and fiat clearance.

**Not GO:** this branch intentionally does not open a real crypto mint. Do not flip the release constant just because wallet payable turns true. `VITE_LIA_LIVE_TRADING=0` remains independent.
