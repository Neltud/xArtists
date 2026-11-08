# xArtists Art-ID #001 — N. TUDURI — publication IPFS / MultiversX

Status: **PREPUBLICATION / NO MINT** (2026-11-08). No CID, pin receipt, mint tx or on-chain listing has been verified.

## Source artifact
Local conversation attachment: `N_TUDURI_3D_lab_v8_prepublication.zip` (not committed to Git; do not upload artist source photos to a public repository without explicit consent).

- Artist: N. TUDURI (artist-declared authorship).
- Physical medium: hand-made terracotta, painted, patinated, scratched and engraved; signature on front.
- Reference views: front (signed), left, right, back.
- Declared height: approximately 25 cm; declared diameter: approximately 7 cm **at an unspecified section**.
- Experimental digital mesh: `N_TUDURI_multivue_normals_fixed_v8.glb`; 0.25 m tall; max modeled width approximately 12.55 cm; **NOT** a measured scan.
- Preview: `rendu_4_angles_v7.png`.
- Status: prototype, not photogrammetric reconstruction; no accurate UV atlas or 3D engraved signature.
- Physical artwork ownership, copyright, and authenticity are **not** transferred or certified by minting the model.

## Safe publication sequence

1. Confirm whether the upload is **public preview** or **final NFT**. Default to public preview only.
2. Inspect source archive, validate GLB parseability and render, SHA-256 each byte-exact file, check archive for accidental secrets and private material.
3. Confirm Render access API has migrations 004 and 005 applied to its **actual** PostgreSQL database, `CREATOR_MEDIA_UPLOAD_ENABLED=1` only after security and quota review, and a server-side `PINATA_JWT`. Never put JWT in browser, GitHub commits, or chat.
4. Sign a fresh Studio SIWX challenge with the artist's xPortal wallet. Do not bypass challenge or impersonate wallet ownership.
5. Upload the GLB (model/gltf-binary) and preview PNG through an **explicitly supported** IPFS upload route. Existing Studio route documentation currently allows JPEG/PNG/WebP/MP4 only; **GLB must be added and tested before attempting its upload**. Reject unsupported MIME rather than changing file extension.
6. Verify each returned CID by reading through two independent IPFS gateways, compare SHA-256 of retrieved bytes against source, record receipts and gateway readback. A returned CID alone is insufficient for redundancy/durability.
7. Produce final JSON metadata with verified `ipfs://` preview and GLB URIs, mark model as approximate and physical rights as not transferred. Pin JSON, read it back and verify exact bytes/hash.
8. Only after review, choose a real MultiversX NFT collection, verify `ESDTRoleNFTCreate` for the artist wallet, prepare the transaction and have the owner sign. Confirm finality, token identifier and metadata on MultiversX API/Explorer.
9. Marketplace listing is a **separate** wallet-authorized transaction, with contract/listing readback; custody alone is not proof of a listing.

## Implementation blocker: GLB support

`docs/CREATOR_MEDIA_UPLOAD_IPFS.md` currently documents `POST /v1/studio/media/upload` for JPEG/PNG/WebP/MP4 only. Do not send GLB until server-side file signature, MIME validation, max size, quota, metadata and readback have explicit test coverage. Do not switch on production upload flags as a shortcut.

## Evidence record (fill only from actual verified actions)

| Field | Value |
| --- | --- |
| GLB SHA-256 | Pending |
| Preview SHA-256 | Pending |
| GLB CID | Not uploaded |
| Preview CID | Not uploaded |
| Metadata CID | Not uploaded |
| Independent gateway readbacks | Not run |
| Wallet signer address | Not verified |
| Collection and NFT nonce | Not issued |
| MultiversX mint transaction | Not submitted |
| Marketplace listing | Not submitted |

### Acceptance gate

**IPFS PREVIEW GO**: authenticated uploader, GLB supported by tested backend, CID pin receipts, two gateway readbacks and exact SHA-256 match.

**NFT MINT GO**: preview gate + finalized metadata + user-approved signed wallet transaction + on-chain confirmation.

**Marketplace GO**: mint gate + listing transaction and contract readback.

All three remain **NO-GO** until evidence exists.


## Mobile visualisation and photo-real preview (2026-11-08 V9)

An Android screenshot reproduced a local-file problem: opening `viewer.html` through a `content://media/external/file` URL made `GLTFLoader.load('./model.glb')` fail with `Failed to fetch`. This is **not** evidence of a malformed GLB.

A local (not uploaded to GitHub) V9 distribution package now exists for this artwork:
- H.264 720x1280 / 24 fps / ~22.7-second MP4 made from **the artist's four original photographs plus an excerpt of the original video**, i.e. a photo-real media presentation, **not a photogrammetric 3D turntable**.
- A single-file offline HTML photo explorer with four embedded reference images, touch navigation, slider and autoplay, QA-tested on Chromium mobile viewport. Transitions are between photographs, not continuous 360-degree reconstructed geometry.
- A separate experimental single-file HTML 3D prototype embedding the GLB bytewise and parsing it with `GLTFLoader.parse(ArrayBuffer, '', onLoad, onError)` rather than fetching a relative local path. Three.js itself still requires CDN/network access; Android `content://` module execution is not proven reliable. Prefer hosting in xArtists under HTTPS.
- No media or source photograph has been committed to this public repository. Local package is `N_TUDURI_diffusion_mobile_v9.zip` in the conversation artifacts.

**Delivery rule:** use a native `<video controls playsinline preload="metadata">` with an MP4 fallback and verified poster URI for public mobile artworks. Only show interactive GLB viewer when hosted over HTTPS with proper CORS, correct `model/gltf-binary` MIME and successful load status. On loader error, present poster/video instead of a blank page. Do not mislabel photo crossfades as a 3D scan or assume a mobile browser will fetch relative files from `content://`.

**Before public release:** obtain media CIDs and hash readback proofs via signed Studio session; confirm publication scope for source media; secure HTTPS URLs and run real-device browser checks. Never declare IPFS pinning or mainnet NFT mint based solely on exported local files.


## V12 → V13 visual quality verdict (2026-11-08)

The previous V12 generated turntable MP4 was reviewed and **rejected as a public artwork preview**: 360 × 640 px, only 4 seconds, low-fidelity interpolated texture and overly regular estimated geometry. It must not be automatically selected as marketplace poster or preview.

Two separate local V13 previews were exported and decoded successfully (not uploaded to Git):
- **Recommended public candidate:** `N_TUDURI_presentation_PHOTOS_REELLES_V13_960p.mp4`, H.264, 960 × 1706, 30 fps, 14.667 seconds; gallery slideshow of four real artist photos, returning to signed front, soft transitions, no fabricated intermediate 3D view. **This is not a continuous 3D rotation.**
- **Experimental only:** `N_TUDURI_rotation_3D_MODELE_EXPERIMENTAL_v13.mp4`, H.264, 720 × 1280, 30 fps, 8 seconds; simulated 360° from estimated V12 geometry and four-view photographic UV atlas, visually improved over V12 but still not photogrammetric or metrically certified.

Neither V13 is pinned, hosted or minted. Before publishing either, respect artist's licensing and separate `studio_media` signature/IPFS pin/readback workflow. A true 360° validated GLB requires multi-view camera pose estimation and additional capture; quality of a rendered MP4 does **not** prove the geometric scan.
