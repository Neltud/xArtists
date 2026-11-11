# TON Dual-Stack Architecture — Level 4

**Status:** Design only · **Date:** 2026-11-11  
**Principle:** One product · Two executors · One intent  
**Primary chain:** MultiversX  
**Secondary chain:** TON (The Open Network)

This document defines the dual-stack lane. It does **not** authorize implementation until Phase A exit criteria are met.

---

## 1. Non-goals (explicit)

- No automatic cross-chain bridge in v1.
- No silent currency conversion (EGLD ↔ TON).
- No dual mint of the same artwork identity across chains.
- No LIA live trading on either chain until separate GO.
- No WalletConnect-inside-Telegram-Mini-App (use TON Connect).
- No activation of TON transactional paths while MultiversX list→buy→receipt is unproven publicly.

---

## 2. Architecture

```
[UI / Command Bar / Discovery Grid]
        │  Intent (list | buy | bid | mint | offer)
        ▼
[Intent Router — LIA]
  · chain preference / quote / policy
  · fail-closed if adapter disarmed
        │
   ┌────┴────┐
   ▼         ▼
AdapterMX   AdapterTON
xPortal     TON Connect
Market SC   Jetton / NFT collection
Agents SC   owner-controlled collection
EGLD / TRO  TON / USDT (jetton)
   │         │
   └────┬────┘
        ▼
 Settlement + Receipt
 (txHash · chainId · explorer URL)
```

**Card rule:** one card = one chain. Badge mandatory: `MultiversX` | `TON`.

**Feature flags (default 0 / false):**

| Flag | Meaning |
|------|---------|
| `VITE_MX_LIVE_MARKET` | MultiversX list/buy armed |
| `VITE_TON_CONNECT` | TON Connect UI visible |
| `VITE_TON_LIVE_MARKET` | TON list/buy armed |
| `VITE_LIA_LIVE_TRADING` | Autonomous LIA (always 0 until separate GO) |

---

## 3. Phases and exit criteria

### Phase A — MultiversX solid (BLOCKING)

**Objective:** Public, demonstrated MultiversX path.

Exit criteria (all required):

1. Discovery grid live, xMEX excluded, real images proven.
2. Navigation / home journeys stable on main.
3. At least one **owner-signed list → buy → NFT received** path proven (controlled env then public smoke).
4. PayBox / commercial rails remain fail-closed until separate commercial GO.
5. `LIA_LIVE_TRADING=0` maintained.

**No TON code lands before Phase A exit.**

### Phase B — TON read-only discovery

- Grid sources may include external TON collections (read-only API).
- Badge `TON · non listé xArtists` (or equivalent i18n).
- Zero buy/list/mint buttons for TON items.
- CI: no regression on MultiversX paths.

### Phase C — TON Connect (wallet only)

- `@tonconnect/ui-react` + `tonconnect-manifest.json` at app origin.
- Connect / disconnect / `ton_proof` optional for account binding.
- Read balance / NFT ownership display only.
- No sendTransaction in product UI until Phase D.

### Phase D — TON transactional (single collection)

- One owner-controlled TON collection.
- List + buy with owner signature and on-chain receipt.
- Same proof standard as MultiversX (signed list → payment → NFT in buyer wallet).
- Royalties and supply locked in contract metadata.

### Phase E — Intent dual-router

- LIA / Command Bar emits chain-agnostic intent.
- Router selects AdapterMX or AdapterTON by user preference + quote policy.
- Fail-closed if selected adapter flag is off.
- No cross-settlement (pay on A, deliver on B) without a separate audited escrow design.

---

## 4. TON stack reference

| Layer | Package / service |
|-------|-------------------|
| Connect UI | `@tonconnect/ui-react` |
| Core | `@ton/ton`, `@ton/core` |
| Assets | `@ton-community/assets-sdk` |
| Payments | TON Pay (beta) or manual jetton + confirm |
| Mini App (later) | Telegram Bot API + TON Connect |
| Explorer | tonviewer / tonscan |

**Manifest** (`/tonconnect-manifest.json`):

```json
{
  "url": "https://xartists.art",
  "name": "xArtists",
  "iconUrl": "https://xartists.art/icon-192.png",
  "termsOfUseUrl": "https://xartists.art/legal",
  "privacyPolicyUrl": "https://xartists.art/legal"
}
```

---

## 5. Security and ops

- Separate hot/warm keys per chain; no shared PEM across MX and TON.
- Circuit breakers independent (`pause` on each market contract).
- Treasury destinations explicit and non-null only after documented GO.
- Guardian / monitoring: volume anomaly and failed settlement alerts per chain.
- Incident rule: freeze the failing adapter flag without taking the other chain offline.

---

## 6. Entry criteria checklist (before any TON PR)

- [ ] Phase A exit criteria signed off (see §3).
- [ ] MultiversX public smoke: list → buy → possession documented with tx hashes.
- [ ] Commercial rails policy unchanged (fail-closed unless separate GO).
- [ ] This document reviewed; non-goals still accepted.
- [ ] Feature flags default off in production build.

---

## 7. Relation to current sprint (2026-11-11)

| Workstream | Priority |
|------------|----------|
| Close MX UX/CI lot (#499 and related) | **P0** |
| MX transactional proof | **P0** |
| TON dual-stack implementation | **Blocked** until Phase A |
| This architecture doc | **Done (design)** |

---

## 8. Owners

| Role | Scope |
|------|--------|
| Grok / Vellum Architect | Architecture, gates, sequencing |
| Neltud | Product GO, key custody, commercial rails |
| LIA | Intent routing (paper until dual GO) |

---

*Document is design-only. Implementation PRs must reference Phase exit criteria and keep MultiversX as the primary execution rail.*
