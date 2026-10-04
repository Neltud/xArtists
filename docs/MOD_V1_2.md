# MOD-V1.2 — Intelligence Visualization

## Fixed (do not regress)
- RCE: `formatRCE` / never render `{min,max,list}` raw
- CommandWall Pulse: local flash only (no 45s TX watchdog)
- Market metrics: macro BTC/ETH/EGLD + shadow KPIs

## New
| Component | Role |
|-----------|------|
| `IntentFeedTerminal` | Cyberpunk log `[SIMULATED]` from shadow + local intents |
| `marketAura.ts` | Vol proxy → nervous/stable/aggressive aura |
| `formatRCE` | Safe pack/RCE strings |
| `micro_esdt_proof --send` | Optional ESDT dust self-transfer |

## Protocols
- `LIA_LIVE_TRADING=0`
- All performance labels SHADOW/SIMULATED
- Shadow sprint continues without reset
