# COLMAP / Meshroom worker (Akash)

Worker **hors navigateur** pour jumeau numérique métrique.

## Rôle

- `POST /jobs` — reçoit métadonnées + références images (ou multipart ZIP)
- Pipeline : COLMAP (feature/match/mapper/dense) **ou** Meshroom headless
- Application échelle via `scaleBarCm`
- Export GLB + certificat `metric-certified`
- `GET /jobs/:id` — statut / résultat

## Sécurité

- **Aucun PEM** MultiversX dans le conteneur
- Pas de mint on-chain depuis le worker
- Entrée images uniquement ; sortie mesh + JSON certificat

## Ressources

COLMAP dense bénéficie d’un **GPU**. CPU possible mais lent (heures).

## Déploiement

1. Build image (GPU base + colmap)
2. Push `ghcr.io/neltud/xartists-colmap-worker:latest`
3. Deploy Console avec `deploy.yaml`
4. dApp : `VITE_COLMAP_WORKER_URL=https://…`

## Statut actuel

Scaffold API Node (`worker.mjs`) prêt pour brancher binaire COLMAP dans l’image.
Tant que COLMAP n’est pas dans l’image, les jobs restent **paper / relative**.
