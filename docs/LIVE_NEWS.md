# Live News — Command Center

## Sources (sans clé CryptoCompare)

| Source | Où |
|--------|-----|
| MultiversX economics (prix EGLD) | API publique |
| Reddit `r/MultiversX` | JSON public (worker + client si CORS OK) |
| CoinTelegraph / CoinDesk RSS | via rss2json (worker Node) |
| Seed blog MultiversX | fallback |

## Fichiers

- `services/news-worker/fetch_news.mjs`
- `apps/frontend/public/data/live_news.json`
- `LiveNewsStream.tsx` — UI scroll + liens

## Format

```json
{
  "version": 2,
  "updatedAt": "ISO-8601",
  "items": [
    {
      "id": "news-1",
      "timestamp": "10:45",
      "source": "xExchange",
      "title": "Mise à jour des pools…",
      "link": "https://…"
    }
  ]
}
```

## Ops

```bash
node services/news-worker/fetch_news.mjs
git add apps/frontend/public/data/live_news.json && git commit -m "chore: refresh live_news"
```

Cron Actions recommandé : toutes les 6 h.

Disclaimer : paper / éducatif — pas un conseil financier.
