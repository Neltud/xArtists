# Akash — worker indexeur xArtists

## Rôle

Processus **off-chain** qui :

1. Interroge l’API MultiversX (`/nfts`, collections configurées)
2. Normalise métadonnées / thumbnails (weserv si besoin)
3. Expose un JSON HTTP (`GET /catalog`, `GET /health`) pour la dApp ou un CDN

**Ne contient aucune clé PEM.** Les SC et la vérité on-chain restent sur MultiversX.

## Pourquoi Akash

| Besoin | Akash |
|--------|--------|
| Index toujours-on sans VPS AWS | Oui — container + lease |
| Coût CPU faible 24/7 | Oui (marketplace) |
| GPU LIA / inference | Autre SDL (GPU profile) plus tard |
| Front SPA | Non — reste GitHub Pages |

## Déploiement rapide

1. [Akash Console](https://console.akash.network) → **Deploy**
2. Coller `deploy.yaml` (ajuster `image` quand `ghcr.io/neltud/xartists-indexer` est publié)
3. Accepter un bid provider (uakt)
4. Noter l’URL publique du lease
5. Côté dApp : `VITE_CATALOG_API=https://<lease-host>` (ou proxy Pages)

### CLI (résumé)

```bash
provider-services tx deployment create deploy.yaml --from <wallet> --chain-id akashnet-2
# accepter le bid, puis
provider-services lease status --dseq <DSEQ> --from <wallet>
```

## Image worker (cible)

Repo suggéré : conteneur Node qui boucle :

- `GET {MVX_API}/collections/{id}/nfts?size=100`
- écrit `catalog.json` en mémoire / volume
- `GET /catalog` → JSON
- `GET /health` → `{ ok, ts, collections }`

Variables : voir `deploy.yaml` (`COLLECTIONS`, `POLL_INTERVAL_SEC`, `CORS_ORIGIN`).

## Sécurité

- Pas de PEM LIA / deployer dans l’env Akash publique
- CORS restreint à `neltud.github.io`
- Rate-limit côté worker si exposé globalement
- Snapshot optionnel vers IPFS / webhook **sans** secrets hardcodés

## Lien dApp

Tant que l’image custom n’est pas live, la dApp continue d’utiliser le catalogue GitHub (`public/data/…`). Brancher `VITE_CATALOG_API` une fois le lease stable.
