# ATC vs TCA — content funnel & gate

## Naming (locked)

| Acronym | Layer | Who |
|---------|-------|-----|
| **ATC** | Arts, Techniques & Civilisations | Public educational layer (free) |
| **TCA** | Immersive classroom + RAG hologram | Premium — **Pack Pulse** (12 months) |

## Conversion loop

```
YouTube / X / FB (ATC free)
        ↓
/tca SAMPLE — YouTube embed (sample_01)
        ↓  CTA → /agents
Pack Pulse mint / buy
        ↓
/tca FULL — hologram + lip-sync + RAG Q&A
```

## Gate modes (air-gap)

| Mode | Condition | UI |
|------|-----------|-----|
| **FULL** | Active Pulse (`activatedAt + 365d`) | TcaClassroom |
| **SAMPLE** | Wallet, no/expired Pulse | YouTube + CTA |
| **NONE** | No wallet | Lobby connect / offers |

Gatekeeper: `TcaGatePage` — **reads** packs only, **never** writes ledger.  
Purchases: `/agents` (Genesis / MoonPay).

## Demo FULL (dev only)

```js
localStorage.setItem('xartists_tca_demo_packs', JSON.stringify(['pulse_pack_v1']))
location.reload()
```

## Content engine (ops)

1. Record / export masterclass → YouTube (tag `#TCA_Masterclass`).
2. Run `python scripts/sync_tca_sample_youtube.py` with `YOUTUBE_API_KEY` in env (not git).
3. Script updates `data/tca/sample_lesson.json` (+ public copy).
4. Optional later: feed transcript chunks into `knowledge/` for RAG (manual review).

## Masterclass workflow

Live session → export → (optional) RAG chunk review → SAMPLE embed updates → FULL can discuss only what is in knowledge packs.

## Pillars (unchanged)

1. **Machine** — Guardian/Genesis locked  
2. **Intellect** — ATC public + TCA premium  
3. **Patronage** — Command Center read-only vs ledger  
