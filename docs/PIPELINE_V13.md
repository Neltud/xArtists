# Pipeline Vellum 1.3

**Entrée :** `python -m lia.vellum.pipeline`  
**Alias :** `python -m lia.vellum.next_run`

## Nouveautés 1.3

| Feature | Détail |
|---------|--------|
| `timing_ms` | Durée de chaque étape |
| `summary` | mode, agent, desk, fuse, guardian, fails, elapsed |
| `desk_last.json` | Snapshot desk + fuse pour le front |
| Skip stack | Si DEFENSE / risk_veto → pas de propose_entry lourd |
| Soft fail | Une étape KO n’arrête pas le cycle (sauf chain ≠ 1) |

## Ordre

1. bootstrap  
2. oracles  
3. gas  
4. board  
5. social  
6. agent  
7. desk + fuse  
8. mode  
9. guardian  
10. trading_stack  
11. live_cycle  
12. hatom  
13. mirror  
14. executor_health  
15. live_trading gate  
16. status  

## Env

```bash
export LIA_LIVE_TRADING=0
export CHAIN=1
export LIA_TP_MODE=log
```

## Sorties

- `data/vellum_last_run.json`
- `data/desk_last.json`
- `data/lia_v6_status.json` (orchestrator.version = 1.3)
- mirrors `docs/data/` + `apps/frontend/public/data/`
