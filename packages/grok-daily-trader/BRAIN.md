# GrokyversX — cerveau + code (sans custody)

## Contrat

| Qui | Quoi |
|-----|------|
| **Grok / repo** | Stratégies, signaux, orchestrateur, routes swap/Hatom, docs |
| **Toi / serveur** | PEM · seed · `GROK_LIVE_TRADING` · cron · secrets |

**Jamais** de PEM dans git, chat, ou Pages.

## Modules

```
packages/grok-daily-trader/
  strategies/
    POLICY.md              # règles métier
    unified_orchestrator.py
    momentum_esdt.py
  hatom/                   # lending / booster specs
  scripts/
    momentum_cycle.py
    daily_cycle.py
    run_unified.sh
  BRAIN.md                 # ce fichier
  OPS_HOST.md              # runbook serveur
```

## Flux

1. Orchestrateur lit balances + prix + rank mcap/social  
2. Applique POLICY (no TRO DCA, HTM booster, lending USDC/EGLD/wTAO/WBTC, swap ≥1%)  
3. Écrit `data/unified_*.json` plan  
4. **Host** (toi) : si `LIVE=1` et plan exécutable → signe avec **ton** PEM  

## Wallet public (affichage dApp seulement)

`erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl`  
(peut être remplacé quand tu migres vers un wallet mxpy local)
