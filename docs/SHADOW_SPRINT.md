# 7-Day Shadow Sprint

**Mode:** paper only (`LIA_LIVE_TRADING=0`)  
**Bridge:** placeBid micro-proof confirmed (EGLD → market SC payable)

## Loop

1. **SCAN** — MultiversX economics + TRO token + synthetic sentiment/vol  
2. **DECIDE** — Level 1–2 paper actions (BUY/SELL/HOLD)  
3. **SIMULATE** — friction (gas 0.0008 EGLD + liquidity slippage)  
4. **LOG** — `data/lia_paper_legs.json`, `lia_shadow_export.json`, `lia_shadow_sprint.json`

```bash
PYTHONPATH=. python -m lia.shadow.sprint --seed-24h   # first 24h log
PYTHONPATH=. python -m lia.shadow.sprint              # one tick
PYTHONPATH=. python -m lia.shadow.sprint --status
PYTHONPATH=. python -m lia.vellum.publish_lia_status  # hub aggregator
```

Automation: schedule `sprint` every 1–4h + daily `publish_lia_status`.

## Hub UI (`/#/lia`)

- Aura from `lia_status` / client derive (poll 15s)
- Shadow performance: PnL, win rate, day index, equity curve
- Intent feed (paper)

## ESDT micro-proof (next)

```bash
PYTHONPATH=. python -m lia.deployer.micro_esdt_proof --token TRO-94c925 --amount 0.0001
```

Dry-run only until deployer holds dust token + sprint day-1 logged.

## Rules

- No real capital in the sprint  
- Not financial advice  
- Beta capital only after 7 days + micro-proofs documented  
