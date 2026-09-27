# xArtists Vision — « Google Earth de l’art mondial »

## Ambition

Couche planétaire navigable : musées, galeries, expos, événements, défis artistes, classes / ateliers — reliée MultiversX pour identité, ownership 1/1, location d’espace et mint jumeaux numériques.

## Couches produit

| Couche | Contenu | État |
|--------|---------|------|
| **Globe / carte** | Villes · musées virtuels · pin expos | `GuidedWorldTour`, `museumWorldCatalog` |
| **Salles 3D** | Halls WebGL 3e personne · œuvres · sculptures | `MuseumWebGLHall` + catalogue quotidien Met |
| **Catalogue vivant** | Open Access Met (cron) + NFT on-chain | `museum-catalog-daily` + Akash indexer |
| **Galeries & lieux** | Comptes venue · location mur dégressive | `/venues` |
| **Événements** | Expo temporaires · openings | paper intents → SC events (futur) |
| **Défis artistes** | Challenges · classes · ateliers | Studio + packs agents (produits, pas investissement) |
| **Jumeau 1/1** | COLMAP labo · certificat metric · mint | `/digital-twin` + worker GPU |
| **Économie** | Tips · ads · packs · slot paper · TRO utility | flags SC OFF jusqu’à GO_LIVE |

## Worker GPU Akash (COLMAP)

1. `docker build -f deploy/akash/colmap-worker/Dockerfile.gpu -t ghcr.io/neltud/xartists-colmap-worker:latest deploy/akash/colmap-worker`
2. Push GHCR
3. Deploy `deploy.gpu.yaml` (Console Akash)
4. `VITE_COLMAP_WORKER_URL=https://<ingress>`
5. Job ≥ 40 photos + mire 20 cm → `metric-certified`

## Indexeur

`VITE_CATALOG_API` → `/health` + `/catalog` — **pas de PEM** sur Akash.

## Principes

- Open Access / droits clairs pour catalogue auto
- Paper ≠ live · SC immuables après deploy
- Packs / agents = produits numériques limités, pas produits financiers
- PEM jamais git / front / Vellum / Akash

## Roadmap

1. Catalogue quotidien + textures salles
2. Realism WebGL mobile-safe
3. Worker COLMAP GPU réel
4. Globe : plus de villes / galeries
5. Events + challenges UI
6. SC venue-split + sculpture 1/1 après audit
