# Audit dApp + régression — 2026-08-09

## Tests Python

```text
PASS=76 FAIL=0  (~2.8s)
PYTHONPATH=. LIA_LIVE_TRADING=0 python3 tests/regression/run_all.py
```

### Bugs corrigés

| Bug | Fichier | Fix |
|-----|---------|-----|
| `elif` vide (SyntaxError) | `compound_engine.py` | outcomes close_trade |
| `levels()` dupliqué / cassé | `compound_engine.py` | signature unique + strategy |
| `pnl_usd` undefined | `compound_engine.py` | total_pnl |
| FAST_CORRIDOR → inventory | `bridge/latency.py` | exclure inventory sans stock |
| old_docs_problem | `test_symbiosis.py` | new_default_ok |

## Front — bonnes pratiques en place

- Lazy routes + TxShell seulement sur chemins TX
- ErrorBoundary, skip link, stale banner
- InfoTip / PageGuide / ScStatusBanner
- Virtual NFT grid
- Séparation LIA vs wallet user

## Lacunes produit

- SC marketplace / agents non live
- Signature sdk-dapp E2E
- Index listings
- Mission/Reserve
- LIA_LIVE_TRADING=0

## À maintenir

1. Guardian before Brain
2. Pas de market « live » sans codeHash
3. Pipeline 1.3 paper-first
4. Régression verte avant merge trading
5. PEM hors git
