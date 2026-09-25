# Akash leases — xArtists

## Preuve de déploiement (2026-09-25)

| Champ | Valeur |
|-------|--------|
| Console | [console.akash.network](https://console.akash.network) |
| Deployment | Hello World (onboarding) |
| Provider | `provider.h6i-dedicated.eu-se-1.digitalfrontier.so` (eu-east / digital frontier) |
| Resources | 0.5 vCPU · ~512 Mi RAM · ~512 Mi storage |
| Image | `ghcr.io/akash-network/hello-akash-world:2.1.0` |
| Status | **Running** 1/1 |
| URL publique | http://rfqkb6agcle8n1o7206lpmkj0g.ingress.h6i-dedicated.eu-se-1.digitalfrontier.so |

Vérifié : HTTP **200** (Next.js Hello World).

## Prochaine étape — indexeur xArtists

1. **Fermer ou laisser** le Hello World (coût faible ; utile comme canary).
2. Nouveau deploy avec `deploy/akash/indexer/deploy.yaml` **après** publication de l’image :
   - Build : `deploy/akash/indexer/Dockerfile`
   - Tag : `ghcr.io/neltud/xartists-indexer:latest` (ou ton registry)
3. Une fois le lease indexeur UP :
   - `GET {url}/health`
   - `GET {url}/catalog`
   - dApp : `VITE_CATALOG_API=https://…` (HTTPS recommandé via provider / proxy)

## Sécurité

- Aucune PEM dans les env Akash
- CORS ciblé `neltud.github.io` sur l’indexeur
- Hello World = démo uniquement, pas de données xArtists
