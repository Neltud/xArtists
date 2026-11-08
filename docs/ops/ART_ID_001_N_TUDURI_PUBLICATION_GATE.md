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
