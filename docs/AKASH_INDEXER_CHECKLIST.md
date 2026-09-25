# Checklist Akash indexeur xArtists

## Canary Hello World

- [x] Lease Running — Digital Frontier EU
- [x] URL : `http://rfqkb6agcle8n1o7206lpmkj0g.ingress.h6i-dedicated.eu-se-1.digitalfrontier.so`
- [ ] **Décision** : garder comme canary **ou** close pour économiser uAKT

## Build & push image (sur ta machine / CI)

```bash
cd deploy/akash/indexer
# worker.example.mjs est copié en worker.mjs dans le Dockerfile
docker build -t ghcr.io/neltud/xartists-indexer:latest .
docker push ghcr.io/neltud/xartists-indexer:latest
```

Prérequis : login GHCR (`echo $TOKEN | docker login ghcr.io -u USER --password-stdin`).

## Nouveau deploy Console

1. Akash Console → Deploy → coller `deploy/akash/indexer/deploy.yaml`
2. Accepter bid (même ordre de grandeur que Hello World : 0.5 vCPU / 512 Mi)
3. Attendre **Running**

## Tests

```bash
curl -sS "{NOUVELLE_URL}/health"
curl -sS "{NOUVELLE_URL}/catalog" | head -c 400
```

Attendu health : `{ "ok": true, "collections": [...], "total_nfts": N }`

## Brancher la dApp

GitHub Pages / secrets build :

```
VITE_CATALOG_API=http://{host-ingress-indexeur}
```

(Préférer HTTPS si le provider expose TLS.)

La dApp essaie d’abord cette API, puis le JSON GitHub en fallback.

## Sécurité

- [x] Pas de PEM sur Akash
- [x] Lecture API MultiversX publique uniquement
- [ ] CORS = `https://neltud.github.io` en prod
