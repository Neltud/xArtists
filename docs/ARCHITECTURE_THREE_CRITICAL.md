# Three critical components — technical architecture

**Audience:** Lead quant + SC architect · **Network:** MultiversX mainnet + Solana signals  
**Principle:** Guardian before Brain · paper-first · non-custodial · Fast Path = pure math

---

## TASK 1 — Asynchronous Guardian (Pre-Flight Risk Validator)

### Placement

```
Slow Path (LLM / desk_debate / GSN)
        │ signal {side, conf, edge}
        ▼
Fast Path PreFlightValidator  ◄── pure float, target <10ms, no I/O
        │ ALLOW | RESIZE | REJECT | KILL
        ▼
guardian_gate (spiral) → executor (paper or live PEM)
```

### Module

`lia/guardian/preflight.py`

| Input | Use |
|-------|-----|
| `ProposedOrder` | notional, lev, chain, stop/take, LLM conf/edge, live flag |
| `PortfolioSnapshot` | equity, DD, ROE, compound intensity, wins/losses, σ |
| `KillSwitch` | ARMED → TRIPPED → KILLED → RESET_PENDING → ARMED |

### Math (hot path)

- **VaR** parametric: `z * σ * √t * notional * lev` (z≈1.65)
- **Kelly** quarter-Kelly: `f = 0.25 * (p - (1-p)/b)`, cap 0.25
- **Size**: `min(order, kelly*eq, stop_risk, L_max*eq, guardian.max_notional)`
- **Spiral**: existing `spiral_score` + `guardian_gate`

### Kill-switch state machine

```
ARMED --hard breach--> TRIPPED --persist/critical--> KILLED
TRIPPED --metrics recover--> ARMED          (soft only)
KILLED --ops reset()--> RESET_PENDING --warmup--> ARMED
```

Brain/LLM **cannot** call `reset()`. SOL live lev > 1.5 → KILL.

### Pseudo-code

See `PREFLIGHT_PSEUDOCODE` in `preflight.py`.

---

## TASK 2 — Multi-chain liquidity orchestrator

### Module

`lia/bridge/liquidity_orchestrator.py`

### Sequence (+1000 USDC SOL → MVX)

1. Settle SOL PnL in **ops** wallet (never user custody).
2. Guardian allows rebalance.
3. `plan_sol_to_mvx(1000, purpose=dca|rwa_escrow, dst_treasury=Mission)`.
4. Sign source lock (Wormhole-class) + `transfer_id` idempotency key.
5. Source finality → BRIDGING → attestation/VAA.
6. Sign dest redeem **only** to Mission/Reserve bech32.
7. CREDITED → optional `openEscrow` (second explicit tx).

### Race controls

- One in-flight rebalance per `purpose`
- No dest credit without attestation
- No escrow open without CREDITED + Guardian
- Failed → terminal; no silent retry without new `transfer_id`

---

## TASK 3 — RWA Escrow state machine (Rust / MVX)

### Current SC (`contracts/rwa-escrow-bridge`)

Status byte: `0=Open 1=Released 2=Refunded 3=Cancelled`  
Endpoints: `openEscrow`, `releaseToSeller`, `refundAfterDeadline`, `cancelByOwner`  
Patterns: pause, CEI, 2-step ownership, unique `trade_id`

### Target product states (off-chain index + on-chain status)

```
INITIATED (off-chain intent)
    → LOCKED (openEscrow, status=0)
    → SHIPPED (off-chain logistics event, indexed)
    → DELIVERED (off-chain PoD hash)
    → VERIFIED_BY_AI (attestor signature accepted)
    → SETTLED (releaseToSeller, status=1)
    or REFUNDED (status=2)
```

### Verification trigger (LIA → SC)

**v1:** attestor verification **off-chain**; on-chain release owner-gated.  
**v2:** `releaseWithAttestation(id, proof_hash, signature)` + stored attestor pubkey.

AI does **not** hold seller funds; it only attests.

---

## Deployment order (< 20 days)

| Day | Item |
|-----|------|
| 0–2 | Restore `compound_engine`; PreFlight tests green; wire `check_before_open` → PreFlight |
| 3–7 | Deploy nft-marketplace + agents-marketplace; codeHash; Pages |
| 8–12 | Micro user List/Buy; LIA_LIVE_TRADING still 0 |
| 13–16 | Orchestrator paper bridge simulation; Mission/Reserve wallets |
| 17–20 | RWA escrow deploy optional; attestor policy doc |

**LIA_LIVE_TRADING=1** only after micro-proof + PreFlight kill-switch drills.
