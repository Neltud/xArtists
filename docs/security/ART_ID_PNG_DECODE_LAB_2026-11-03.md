# xArt-ID — PNG lab decode (2026-11-03)

**Scope:** `decodePngToRgbaV1` + `phashFromPngBytesV1` for offline/lab use only.

| Allowed | Forbidden |
|---------|-----------|
| 8-bit RGB/RGBA non-interlaced PNG | JPEG/WebP/MP4 in this module |
| ≤4e6 pixels, ≤16 MiB | Public unauthenticated HTTP |
| Feed `computeArtPHash64V1` | `certified_authentic: true` ever |

JPEG remains a separate hardened path (lib-bound or worker) — not in this PR.

Related: issue #324 · `artIdentityVision.mjs` · claimPack testnet is ChatGPT lead.
