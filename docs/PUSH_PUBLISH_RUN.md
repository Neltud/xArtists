# Push · Publish · Run (ops)

## 1. Push
```bash
git pull origin main
# (si commits locaux)
git add -A && git commit -m "ops: sync" && git push origin main
```

## 2. Publish (mirror JSON → front)
```bash
export PYTHONPATH=. LIA_LIVE_TRADING=0 CHAIN=1
python -m lia.signals.fusion
python -m lia.compounding
python -c "from lia.marketplace.intel_catalog import publish_catalog; publish_catalog()"
python -m lia.vellum.publish_data_for_frontend
```

CRITICAL inclut désormais: `signal_ticker.json`, `lia_signal_fusion.json`,
`compounding_echelons.json`, `compounding_annual_sim.json`, `lia_intel_catalog.json`,
`gsn_leaderboard_score.json`, `polymarket_signals.json`, `free_signals.json`.

## 3. Run (cycle Vellum complet paper)
```bash
export PYTHONPATH=. LIA_LIVE_TRADING=0 CHAIN=1
python -m lia.vellum.production_run
```
Phases: chain_timing → gates → pipeline → commander → compounding → **signals** → mirror → deploy_scs (skip sauf flags).

## 4. Pages
Après push main, GitHub Actions rebuild Pages. Ticker: bas d'écran (`SignalTicker`).

## Interdit
`LIA_LIVE_TRADING=1` sans gates verts + codeHash + micro-preuves.
