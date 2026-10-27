# Escrow NFT P1 — MultiversX (spec)

**Status:** specification only · no mainnet effect · 2026-10-27  
**Scope:** digital NFT secondary (and primary when applicable) · **not** physical logistics

## Goal

Atomic **payment vs NFT delivery** on MultiversX.  
No unprotected sequence “pay then hope transfer”.

## Actors

| Role | Duty |
|------|------|
| Buyer | Funds escrow (EGLD or accepted ESDT per listing) |
| Seller | Delivers NFT into escrow / approves pull |
| Escrow SC | Holds funds + NFT; releases atomically or refunds |
| Mediator (optional P1.1) | Dispute path only — not required for happy path |

## State machine

```
LISTED
  → FUNDED              buyer deposit confirmed
  → NFT_DEPOSITED       seller deposited NFT (or permit ready)
  → READY               both legs present
  → SETTLED             atomic release: NFT→buyer, funds→seller
  → REFUNDED            buyer refund, NFT returned if deposited
  → CANCELLED           before FUNDED
  → EXPIRED             timeout without READY
  → DISPUTED            (P1.1) freeze until resolution
```

### Release invariant

```
SETTLED ⇔ funded ∧ nft_deposited ∧ ¬disputed ∧ ¬expired
```

Partial paths:

- `FUNDED` + timeout without NFT → `REFUNDED` to buyer  
- `NFT_DEPOSITED` + timeout without funds → NFT returned to seller  

## Atomic pattern (preferred)

**Single settlement call** (or tightly coupled SC ops):

1. Escrow already holds **funds** and **NFT** (`READY`)
2. `settle(orderId)`:
   - transfer NFT → buyer
   - transfer funds → seller (minus protocol fee if any)
   - mark `SETTLED` (idempotent)

## Forbidden in P1

- Off-chain “seller will send later”
- Two independent wallet transfers without SC custody
- Auto-release without both legs
- Physical carrier events (P2+)
- Dropshipping

## Idempotence

- One `order_id` / `escrow_id`  
- Replay of `settle` / `refund` returns prior terminal state  

## Multichain note

P1 settlement asset on **MultiversX only**.  
Buyer may **fund** via fiat on-ramp in a later adapter; final escrow leg remains EGLD/ESDT on MVX.

## Security checklist

- [ ] Reentrancy guards on settle/refund  
- [ ] Token whitelist (collection / TOKEN_ID)  
- [ ] Amount and nonce bound at `FUNDED`  
- [ ] Pause / circuit breaker  
- [ ] No admin sweep of user funds without timelock + transparency  

## Out of scope

LIA custody-burn for physical no-wallet buyers (separate flow).  
BFY yield on custody wallets (forbidden mix).
