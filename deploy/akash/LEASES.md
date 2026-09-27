# Akash leases — xArtists

## Indexeur catalogue — LIVE

| Champ | Valeur |
|-------|--------|
| Service | `indexer` |
| dseq | `1790359855895` |
| Provider | hurricane (`akash15tl6v6gd0nte0syyxnv57zmmspgju4c3xfmdhk`) |
| Status | **Running** 1/1 |
| **URL HTTPS** | https://kc7hfr7tb9aqreaqtst0834c2c.ingress.hurricane.akash.pub |
| URL HTTP | http://kc7hfr7tb9aqreaqtst0834c2c.ingress.hurricane.akash.pub |
| Health | `GET /health` → ok, 4 collections, 90 NFTs |
| Catalog | `GET /catalog` → JSON dApp |

### Brancher la dApp

Déjà **par défaut** dans `apps/frontend/src/config/catalogApi.ts` (`DEFAULT_CATALOG_API`).

Override optionnel (Pages secret) :

```
VITE_CATALOG_API=https://kc7hfr7tb9aqreaqtst0834c2c.ingress.hurricane.akash.pub
```

CORS : `https://neltud.github.io`.

## Canary Hello World (optionnel)

| Champ | Valeur |
|-------|--------|
| URL | http://rfqkb6agcle8n1o7206lpmkj0g.ingress.h6i-dedicated.eu-se-1.digitalfrontier.so |

Peut être **closed** dans Console pour économiser l’ACT.

## Sécurité

- Aucune PEM / clé wallet dans l’indexeur
- Clé Console : locale uniquement, régénérer si exposée dans un chat
