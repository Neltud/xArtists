# Live News — Command Center

## Objectif

Alimenter `LiveNewsStream` (`#/command-center`) avec des titres **réels** (MultiversX + crypto), pas uniquement du seed fictif.

## Fichiers

| Path | Rôle |
|------|------|
| `services/news-worker/fetch_news.mjs` | Worker Node : CryptoCompare + EGLD economics → JSON |
| `apps/frontend/public/data/live_news.json` | Snapshot publié (Pages) |
| `apps/frontend/src/command-center/LiveNewsStream.tsx` | UI : static JSON + refresh client 5 min |

## Format `live_news.json`

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

## Rafraîchir le snapshot (ops / CI)

```bash
node services/news-worker/fetch_news.mjs
# commit + push apps/frontend/public/data/live_news.json
```

Option GitHub Actions : cron `0 */6 * * *` qui run le worker et commit le JSON.

## Runtime navigateur

1. Charge `data/live_news.json` (puis `mvx_news.json`)
2. En parallèle : **CryptoCompare** news API + **MultiversX economics** (EGLD)
3. Merge + dédup · badge `live` / `cache`
4. Liens cliquables · disclaimer paper dans le footer légal

## Limites

- Pas un conseil financier
- CORS / rate-limit possibles sur CryptoCompare
- Seed MultiversX blog si l’API échoue
