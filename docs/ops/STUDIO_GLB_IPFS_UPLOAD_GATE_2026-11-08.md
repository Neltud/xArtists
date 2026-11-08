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
- For a model, upload an authentic JPEG/PNG/WebP cover image and the GLB with the SAME SIWX-authenticated wallet; the final JSON uses `image: ipfs://POSTER-CID/...` and `animation_url: ipfs://MODEL-CID/artwork-HASH.glb`, `properties.category: model`, `mime: model/gltf-binary`, and `properties.image_sha256`. Immutable metadata fingerprint includes both uploads. Upload success is not minting or certification.

**This validator is intentionally conservative**, not a malware sandbox or complete glTF conformance parser. It blocks dangerous external dependencies, but three-dimensional model complexity, GPU denial-of-service, malicious structured data and provenance require separate review. Add geometry bounds, renderer fault handling, independent gateway readback, and resource budgets before public GLB display. Preview poster pairing is now mandatory for GLB metadata: a second same-wallet, previously pinned JPEG/PNG/WebP produces the public `image` URI plus exact `image_sha256`; the GLB remains in `animation_url`. A model-only NFT metadata record fails closed. Two uploads count toward the existing 8/day per-wallet quota.

## To activate after review

1. Merge and verify the frontend/backend CI and manual 3D GLB validation fixtures.
2. Prove Render access-api is deployed from the intended commit, has migrations 004/005 on its **actual** Postgres and backend-only `PINATA_JWT`, with safe CORS and quota.
3. Run a noncommercial signed test upload with a dedicated wallet: GLB, cover JPEG/PNG/WebP, and the resulting metadata JSON. Each asset must pass two-gateway IPFS readback and byte-by-byte SHA-256 match. Confirm pin durability independently.
4. Get explicit operator approval before setting `STUDIO_GLB_UPLOAD_ENABLED=1` in Render; never put the JWT in the dApp, in Git or in conversation.
5. Keep minting gated on wallet-confirmed collection/role, SAME-WALLET verified image/model pairing, verified metadata and finality of MultiversX transactions. Minting, physical-art ownership, artist rights and marketplace listing are all separate gates.

## N. TUDURI proof-of-concept

The downloadable **xArtists 3D Lab V12** preview is a 25 cm high *interpreted* 3D mesh from four artist-declared cardinal views (front/right/back/left), UV atlas 2048×1024 sourced from real photos, 56,542 seam-split vertices / 112,640 faces, Y-up glTF standalone GLB SHA-256 `2536573760f4459dd1dc99a07b54ce92521c6faf4d999febae0efee558fa9f38`. Mesh is watertight **after position-only UV seam welding**. Width ~12.18 cm, depth ~10.57 cm are **model assumptions**, not measurements. Actual reported 7 cm diameter has unspecified location.

**Angles not SfM-solved:** four artist-labeled cardinal views are nominal 0°, 90°, 180°, 270°. Original HEVC video includes varying distance, tilt and handling and cannot be treated as a uniform calibrated orbit. The new model is better visually than V8 but remains an interpretive geometry and photographic UV, not a certified measured scan. No IPFS CID or on-chain token exists.

The ZIP remains a conversation artifact, not a committed public GitHub media file; original photos should not be leaked into repository by routine deployments.

## V14 preflight for N. TUDURI (2026-11-08)

A separate local, verified ZIP `N_TUDURI_V14_IPFS_PREFLIGHT.zip` was built from the existing V12 prototype and the real signed-front photograph. Neither item was uploaded or committed to Git.

- GLB (self-contained UV-textured prototype; 112,640 triangles): **SHA-256** `2536573760f4459dd1dc99a07b54ce92521c6faf4d999febae0efee558fa9f38` (unchanged source binary).
- JPEG poster 1080 × 1080 (unaltered real artwork image on neutral margins): **SHA-256** `5d63ce8d5684e289e28e09e1460454bafcd05308759e165e293955260ec630dd`.
- Bundled manifest, local preflight verifier, example NFT metadata with placeholder URIs, and publication checklist. ZIP integrity and standalone hash checks passed.
- Model, poster and NFT JSON require **three independently verified IPFS CIDs**, with the image and model upload IDs stored under **the same authenticated artist wallet**. No CID, pin receipt, on-chain token or marketplace listing exists yet.
- Creator Studio allows two uploads for a model (GLB and poster), consuming two of the eight daily quota slots, before pinning one immutable metadata JSON with `image` + `animation_url`. Do not enable production until the actual Render database and migrations are established and the artist confirms publication.

**Visual NO-GO remains:** even with a technically valid GLB and preview poster, the V12 surface is extrapolated from four uncalibrated photographs and does not constitute a metric photogrammetric scan. An authentic full scan needs a controlled camera orbit, measured object scale and SfM/MVS validation.
