# Claude : 2e machine de décision ?

**Non.** Claude n’est **pas** un second exécuteur de trades.

| Rôle | Qui |
|------|-----|
| **Exécution / gates / live TX** | LIA circuit (`guarded_cycle`, `defense`, `micro_trade`, PEM) |
| **Allocation sleeves** | `compound_pyramids` (fixe) via `pyramids_external_allocator` |
| **Signaux social / GSN** | `social_intel` + `SignalBus` (lecture) |
| **Claude** | **Advisor** : `decision_engine` / `run_daily` → propositions JSON, `auto_execute=False` |

Claude propose ; LIA (flags + guards + MICRO_PROOF) décide d’exécuter ou non.

```text
SignalBus / Social / GSN
        ↓
Claude decision_engine  →  journal proposal
        ↓
LIA mode_orchestrator + defense + guards
        ↓
(paper) or live only if LIA_LIVE_TRADING=1 + micro proof
```

Deux cerveaux en lecture, **une seule main** qui signe : LIA wallet sous policy.
