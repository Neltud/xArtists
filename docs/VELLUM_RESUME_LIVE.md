# Vellum — reprendre depuis le dernier publish

**PEM = secret Vellum uniquement** (pas GitHub Secret obligatoire si tout tourne dans Vellum).

## Workflow live (coller dans Vellum)

```
Timer (1–2h)
  → OrchestratorRouter / symbiosis
  → Python: lia.vellum.live_cycle.run_cycle(
        decision=..., confidence=..., size_usd=...,
        token="TRO-94c925", atr=...
    )
  → Optionnel si trade / compound: lia.circuit.vellum_cycle.run_cycle(...)
  → publish: lia.vellum.publish_data_for_frontend.publish()
  → git push data/* + docs/data/* + apps/frontend/public/data/*
```

## Node one-liner

```python
from lia.vellum.live_cycle import run_cycle
print(run_cycle(
    decision="WAIT",   # ou BUY/SELL depuis OrchestratorRouter
    confidence=0.72,
    size_usd=12.0,
    estimated_fee_usd=0.12,
    expected_edge_usd=1.5,
))
```

## Secrets Vellum

| Secret | Rôle |
|--------|------|
| `LIA_WALLET_PEM` | Signature + deploy (jamais git) |
| `LIA_LIVE_TRADING` | `0` dry-run / `1` mainnet |
| `LIA_MVX_API` | `https://api.multiversx.com` |
| `LIA_MVX_PROXY` | gateway |

## Fichiers lus/écrits par le cycle

- `data/lia_trades.json` — historique dashboard
- `data/lia_trailing_state.json` — stops dynamiques
- `data/lia_tro_policy.json` — no-hold TRO
- `data/contracts.json` — adresses SC

## Après chaque run Vellum

Commit/push des JSON `data/*` puis miroir `docs/data/*` et `apps/frontend/public/data/*` pour que le **dashboard GitHub Pages** se mette à jour.
