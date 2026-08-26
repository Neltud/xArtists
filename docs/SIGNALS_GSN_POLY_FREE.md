# Signaux LIA — GSN ≥80% · Polymarket · feeds gratuits

## GreenSmoke Network
- Module: `lia/signals/gsn_leaderboard.py` + `lia/agents/green_smoke_consumer.py`
- **Seuil:** accuracy/confidence ≥ **0.80** uniquement
- Poids max externe GSN: **0.30**
- Jamais exécution seule — advisory avant Guardian

## Polymarket (hors MultiversX)
- Module: `lia/signals/polymarket_feed.py`
- API Gamma publique si joignable, sinon `data/polymarket_feed.json`
- Poids max: **0.12** (bruit politique/macro)
- Tag `chain: polygon_off_mvx`

## Feeds gratuits multi-domaines
- Module: `lia/signals/free_feeds.py`
- Domaines: **crypto, finance, politics, culture, arts**
- Live optionnel: Fear&Greed, CoinGecko EGLD; seed JSON sinon
- Poids trading: crypto+finance; culture/arts surtout ticker

## Fusion
```bash
PYTHONPATH=. python -m lia.signals.fusion
# → data/lia_signal_fusion.json + data/signal_ticker.json
```

## UI
`SignalTicker` — bandeau défilant bas d'écran (au-dessus BottomNav mobile).

## Doctrine
External signals **boost or WAIT** — never override strong LIA SELL; never skip Guardian/Intent for live.
