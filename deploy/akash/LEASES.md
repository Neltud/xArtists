# Akash leases — xArtists

## Indexeur catalogue (2026-09-25) — LIVE

| Champ | Valeur |
|-------|--------|
| Service | `indexer` (node:20-alpine + worker.example.mjs) |
| dseq | `1790359855895` |
| Provider | `akash15tl6v6gd0nte0syyxnv57zmmspgju4c3xfmdhk` (hurricane) |
| Status | **Running** 1/1 |
| URL | http://kc7hfr7tb9aqreaqtst0834c2c.ingress.hurricane.akash.pub |
| Health | `GET /health` → ok, 4 collections, 90 NFTs |
| Catalog | `GET /catalog` → JSON compatible dApp |

### Brancher la dApp (build Pages)

```
VITE_CATALOG_API=http://kc7hfr7tb9aqreaqtst0834c2c.ingress.hurricane.akash.pub
```

CORS autorisé pour `https://neltud.github.io`.

## Canary Hello World (optionnel)

| Champ | Valeur |
|-------|--------|
| dseq | `1790358856208` |
| URL | http://rfqkb6agcle8n1o7206lpmkj0g.ingress.h6i-dedicated.eu-se-1.digitalfrontier.so |
| Image | hello-akash-world |

Peut rester ouvert comme canary ou être fermé pour économiser le crédit Console (`uact`).

## Sécurité

- **Aucune API key / PEM** dans ce fichier ni dans le repo
- Clé Console : variable d’env locale `AKASH_API_KEY` uniquement
- Indexeur = lecture API MultiversX publique uniquement
