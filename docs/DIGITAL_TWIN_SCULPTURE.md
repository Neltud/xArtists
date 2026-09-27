# Jumeau numérique métrique — sculpture 1/1 (COLMAP / labo)

## Objectif

Produire un **mesh métrique certifié** d’une sculpture physique pour :

1. Expo 3D musée (qualité labo, pas approximation navigateur)
2. Mint NFT **1/1** lié au jumeau (métadonnées + hash mesh + certificat)

Le navigateur **ne remplace pas** COLMAP / RealityCapture / Meshroom. Il orchestre :

- capture guidée (protocole photos)
- dépôt job worker
- affichage certificat + preview GLB
- intent mint paper → SC mint après GO_LIVE

## Pipeline (labo)

```
Photos (40–120) + mire d’échelle
        │
        ▼
  Worker COLMAP / Meshroom (Akash ou GPU local)
        │  feature → match → sparse → dense → mesh → texture
        ▼
  Calibration métrique (scale bar connue en cm)
        │
        ▼
  QC (trous, échelle, bounding box, hash SHA-256 GLB)
        │
        ▼
  Certificat JSON + GLB sur IPFS
        │
        ▼
  Mint NFT 1/1 (MultiversX) — métadonnées = CID certificat + CID mesh
```

## Protocole de capture (obligatoire pour grade `lab`)

| Règle | Minimum | Recommandé |
|-------|---------|------------|
| Vues orbitantes | 40 | 80–120 |
| Hauteurs | 2 niveaux | 3 (bas / milieu / haut) |
| Mire d’échelle | 1 barre connue (ex. 20,0 cm) | 2 mires orthogonales |
| Fond | uni, mat | cabine lumière soft |
| EXIF | conservé | RAW + JPEG proxy |
| Chevauchement | ≥ 60 % | 70–80 % |

Sans **mire d’échelle mesurée**, le mesh reste **à échelle relative** (grade `relative`, pas `metric-certified`).

## Grades de confiance

| Grade | Signification | Usage mint |
|-------|---------------|------------|
| `browser-approx` | Silhouette multi-vues WebGL | Paper / démo seulement |
| `relative` | COLMAP sans mire | Preview, pas claim métrique |
| `metric-certified` | COLMAP + scale bar + QC hash | Candidat mint 1/1 |

## Certificat (JSON)

Voir `apps/frontend/src/lib/digitalTwinCertificate.ts`.

Champs critiques :

- `scaleBarCm` + `measuredEdgeMm`
- `meshCid` / `sha256Glb`
- `colmapVersion` / `pipelineId`
- `qc.holeRatio`, `qc.vertexCount`
- `physical.objectId` (lien inventaire)
- `issuer` (xArtists lab paper / future org)

## Worker Akash

`deploy/akash/colmap-worker/` — conteneur GPU/CPU qui :

1. Reçoit un ZIP d’images + `job.json` (scale bar)
2. Lance COLMAP (ou Meshroom headless)
3. Applique l’échelle
4. Exporte GLB + certificat
5. Répond `POST /jobs/{id}/result` (ou écrit objet stocké)

**Aucun PEM** sur le worker. Mint signé côté wallet user / LIA après QC.

## Mint 1/1

Paper aujourd’hui :

```json
{
  "type": "MINT_SCULPTURE_1OF1",
  "paper": true,
  "grade": "metric-certified",
  "certificateCid": "ipfs://…",
  "meshCid": "ipfs://…",
  "sha256Glb": "…",
  "title": "…",
  "artist": "…",
  "dimensionsCm": { "height": …, "width": …, "depth": … }
}
```

On-chain (après audit SC) : ESDT NFT avec URI métadonnées = certificat IPFS.

## Ce qui n’est PAS certifié

- `photoSculpture3d` / `multiViewPhotogrammetry` navigateur
- Mesh sans mire d’échelle
- Export GLB sans `sha256` dans le certificat

## Prochaines étapes techniques

1. Déployer worker COLMAP Akash (GPU) avec SDL dédié
2. UI upload multi-photos + saisie scale bar
3. Stockage IPFS (Pinata / web3.storage) pour GLB + certificat
4. Draft SC `sculpture_1of1` (mint unique, royalties, burn-link physique optionnel)
5. Audit + GO_LIVE avant announcement public « jumeau certifié »
