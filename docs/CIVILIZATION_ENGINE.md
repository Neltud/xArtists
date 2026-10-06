# xArtists — Civilization Engine (Grand Blueprint)

**Philosophy:** Digital monument, not a retail crypto shell.  
**Machine executes · Professor teaches · Patron rules.**

---

## Three pillars (air-gap)

| Pillar | Layer | Role | Write ledger? |
|--------|-------|------|---------------|
| **1 Machine** | LIA Guardian / Genesis / Execution | Risk, dust exec, economic integrity | **Yes** (gated) |
| **2 Intellect** | TCA (classroom, RAG, hologram) | Mentorship, knowledge | **No** |
| **3 Patronage** | Command Center / Museum / Influence UI | Provenance, aura *display*, influence UX | **No** (unless via Genesis) |

```
TCA / Command UI  ──read──►  public data / explorer / shadow JSON
         │
         └──✗── write ledger / mint / burn / stake  (FORBIDDEN)

Only Guardian/Genesis paths may mutate financial state.
```

Trading modules under `lia/guardian/` and `lia/genesis/` stay **LOCKED** unless a critical security patch is ordered.

---

## Already on main (honest map)

| Spec idea | Status |
|-----------|--------|
| Hardened cage (idempotent burn, calldata NFT guard, gas/PnL) | Done |
| TCA classroom + hologram + lip-sync + RAG extractive | Done (T1–T3) |
| Soul profiles / prosody / thinking delay | Done |
| Air-gap TCA vs ledger | Policy + code paths (no TCA ledger writes) |
| Staking SC live | **Keep SC**; UI may *label* patronage later |
| MoonPay | Partial (wallet UX) |
| SBT mastery certificates | **Not** on-chain yet |
| LOD 60 FPS system | **Not** formalized |
| Holographic signal overlays on museum assets | Partial (agent aura) |
| Physical bridge / patronage rewards | Spec only |
| Aura re-eval from TCA study time → price | **Blocked** by zero-ghost unless CEO policy |

---

## Security (Fortress)

| Module | Audit focus |
|--------|-------------|
| Guardian | Size, velocity, NFT calldata, daily loss, gas budget |
| Genesis / economic_validator | Mint/burn idempotency, circulating = minted − burned |
| TCA RAG | Ground answers in `knowledge/chunks.jsonl`; empty → refuse |
| Command / 3D | Display-only; chain is source of truth for balances |

### Performance (LOD)

| LOD | When | Cost |
|-----|------|------|
| LOW | Distant / tab hidden | No particles, simple materials |
| HIGH | Focused asset / classroom | Shaders, dust, audio |

Dynamic culling: pause particles when `document.hidden` or camera far.

---

## Economy & vocabulary (careful)

### Subscription tiers (product, not SC yet)

| Tier | Access |
|------|--------|
| Observer (free) | Public lessons, no Q&A |
| Student (monthly) | Full TCA + Q&A |
| Scholar (annual) | Priority + digital extras |

Payment: MoonPay / EGLD — **through existing payment UX**, not TCA writing balances.

### Staking vs Patronage

- **On-chain:** `tro_staking` remains stake/unstake TRO.  
- **UI copy:** may say “Patronage allocation” *only* as a product synonym when marketing is ready — **do not** remove live stake flows overnight.

### Mint → trade → burn

Already the economic loop in Genesis paper + SC paths. Secondary market = marketplace. Burns = fulfillment / settlement policy.

### Physical bridge

Digital twin “Physical Aura” = **metadata flag** + optional reward *proposal* to Genesis — never auto-mint from TCA engagement alone.

### 30-day aura re-assessment

Allowed inputs for **display scores**: volume, listings, optional TCA study time.  
**Forbidden** without explicit CEO rule: writing study-time into `pack_performance` equity as if it were cash PnL (ghost risk).

---

## Command Center (War Room)

Layout target:

| Zone | Content |
|------|---------|
| Center | 3D stage / provenance |
| Left | Intelligence feed (LIA signals, paper-honest) |
| Right | Patronage panel (influence UX, mastery status) |
| Bottom | Global pulse (liquidity / health, sourced from APIs) |

Holographic signals (pulse / halo / heatmap / wisdom particles) = **visualizations** of metrics, not new oracles.

---

## Intelligence (TCA Brain)

| Piece | Status |
|-------|--------|
| RAG chunks | Live extractive |
| Persona / lip-sync / thinking | Live |
| Cognitive exams + SBT | Backlog (paper grade first, SBT later) |

Mastery score may boost **UI influence weight** only after a written governance rule; not silent ledger credit.

---

## Backlog order (realistic)

1. **LOD + visibility culling** on Museum / TCA (FPS)  
2. **Command Center layout** glass cockpit (read-only data)  
3. **Subscription gates** for TCA Q&A (feature flag)  
4. **Mastery quiz paper** → optional SBT design doc  
5. **Physical aura metadata** schema  
6. Never: TCA → auto equity without Genesis  

---

## Non-goals

- Rewriting Guardian/Execution for “prestige UI”  
- Replacing mainnet staking SC with a metaphor  
- Hallucinated book quotes outside knowledge packs  
