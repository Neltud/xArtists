# LIA Board (xBoard-style)

## Goal

Real-time view of:

- **Past / open / planned** trades
- **Positions** across venues (wallet MVX + Hatom H-tokens + LP labels + external notes)
- **Placement options** (xExchange, OneDex, Hatom, XOXNO, Soul experimental…)
- **Micro / high-frequency arb** scan (honest: MVX ~6s blocks ≠ CEX HFT)
- **3 parallel series** starting at **$10** each (same or different strategies)

## Data

```bash
python -m lia.board.publish
# → data/lia_board.json
```

Vellum: call after orchestrator or on a 1–5 min timer.

## HF arb note

True sub-second HFT is not possible on MultiversX settlement. LIA does **block-time** arb: detect spread xExchange vs OneDex (or API mids), size only if edge > fees + gas. Label: `hf_mode=block_scan`.

## Series

Default: 3 series × $10

| Series | Strategy bias |
|--------|----------------|
| A | momentum / MR fuse |
| B | yield-first (Hatom sleeve) |
| C | micro-arb priority |

Simulated equity curves in `lia_board.json` → Portfolio / Trading UI.
