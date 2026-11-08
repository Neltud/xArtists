# Creator Studio — GLB upload gate (2026-11-08)

**State: CODE REVIEW / PRODUCTION NO-GO.** This work adds an explicit MIME pathway for a self-contained 3D model; it does **not** activate the production uploader or pin an existing artist's GLB.

## Why a distinct switch

Existing media uploads use `CREATOR_MEDIA_UPLOAD_ENABLED` guarded by HTTPS, Pinata JWT, PostgreSQL and signed artist SIWX. New 3D uploads require **both**:

- `CREATOR_MEDIA_UPLOAD_ENABLED=1` (existing artist upload setup).
- `STUDIO_GLB_UPLOAD_ENABLED=1` (new default-**OFF** operator switch).

The `GET /v1/studio/media/config` endpoint reports `modelEnabled` and `maxModelMiB: 32`; it must never expose secrets. Never enable the switch on unreviewed Render services.

## Validation

- Exact Content-Type `model/gltf-binary`; at most 32 MiB.
- GLB header `glTF`, version 2, actual declared byte length.
- First chunk `JSON`, at most 4 MiB, parseable; one embedded `BIN` chunk with bounded byte count and correct chunk alignment.
- `asset.version=2.0`, scene/node/mesh declarations.
- Reject any external image, shader or buffer URI (even `data:`), and reject unknown extensions; no external network fetch is permitted from the model.
- Use the existing artist wallet JWT scope, PostgreSQL quota, SHA-256 registry and server-side Pinata file wrapping. No wallet private key is passed to the backend.
- JSON metadata uses `animation_url: ipfs://CID/artwork-HASH.glb`, `properties.category: model`, `mime: model/gltf-binary`. Upload success is not minting or certification.

**This validator is intentionally conservative**, not a malware sandbox or complete glTF conformance parser. It blocks dangerous external dependencies, but three-dimensional model complexity, GPU denial-of-service, malicious structured data and provenance require separate review. Add geometry bounds, renderer fault handling, independent gateway readback, and resource budgets before public GLB display. Preview poster pairing is not implemented in this PR; a model-only NFT metadata record may not render as artwork in all marketplaces.

## To activate after review

1. Merge and verify the frontend/backend CI and manual 3D GLB validation fixtures.
2. Prove Render access-api is deployed from the intended commit, has migrations 004/005 on its **actual** Postgres and backend-only `PINATA_JWT`, with safe CORS and quota.
3. Run a noncommercial signed test upload with a dedicated wallet, with two-gateway IPFS readback and byte-by-byte SHA-256 match. Confirm pinned asset permanence independently.
4. Get explicit operator approval before setting `STUDIO_GLB_UPLOAD_ENABLED=1` in Render; never put the JWT in the dApp, in Git or in conversation.
5. Keep minting gated on wallet-confirmed collection/role, preview image pairing, verified metadata and finality of MultiversX transactions. Minting, physical-art ownership, artist rights and marketplace listing are all separate gates.

## N. TUDURI proof-of-concept

The downloadable **xArtists 3D Lab V12** preview is a 25 cm high *interpreted* 3D mesh from four artist-declared cardinal views (front/right/back/left), UV atlas 2048×1024 sourced from real photos, 56,542 seam-split vertices / 112,640 faces, standalone GLB SHA-256 `4bd63c052dd5150fc8123605c686a98a40d940d3da642969fa5bbd3b8d80b918`. Mesh is watertight **after position-only UV seam welding**. Width ~12.18 cm, depth ~10.57 cm are **model assumptions**, not measurements. Actual reported 7 cm diameter has unspecified location.

**Angles not SfM-solved:** four artist-labeled cardinal views are nominal 0°, 90°, 180°, 270°. Original HEVC video includes varying distance, tilt and handling and cannot be treated as a uniform calibrated orbit. The new model is better visually than V8 but remains an interpretive geometry and photographic UV, not a certified measured scan. No IPFS CID or on-chain token exists.

The ZIP remains a conversation artifact, not a committed public GitHub media file; original photos should not be leaked into repository by routine deployments.
