# Push · Publish · Run (ops)

## 1. Push
```bash
git pull origin main
git push origin main   # déjà à jour si CI tiré depuis remote
```

## 2. Publish (mirror JSON → front)
```bash
export PYTHONPATH=. LIA_LIVE_TRADING=0 CHAIN=1
python -m lia.signals.fusion
python -m lia.signals.pretrade_gate
python -m lia.compounding
python -m lia.vellum.production_run
```

## 3. Frontend
Après push `main`, GitHub Actions rebuild Pages.  
UI parcours : Home → `UserJourneyStrip` · Hero CTAs numérotés · Trading panels signaux.

## Interdit
`LIA_LIVE_TRADING=1` sans gates + codeHash + micro-preuves.
