# xArt-ID — PNG lab decode (2026-11-03)

**Scope:** `decodePngToRgbaV1` + `phashFromPngBytesV1` for offline/lab use only.

| Allowed | Forbidden |
|---------|-----------|
| 8-bit RGB/RGBA non-interlaced PNG | JPEG/WebP/MP4 in this module |
| ≤4e6 pixels, ≤16 MiB | Public unauthenticated HTTP |
| Feed `computeArtPHash64V1` | `certified_authentic: true` ever |

JPEG remains a separate hardened path (lib-bound or worker) — not in this PR.

Related: issue #324 · `artIdentityVision.mjs` · claimPack testnet is ChatGPT lead.


## Strict parser and unresolved production controls

This **lab subset** validates PNG chunk CRC32 (type+data), mandatory
first and single IHDR, IDAT contiguity, mandatory final IEND,
no trailing bytes, 8-bit RGB/RGBA, approved compression/filter/interlace
modes, ≤1,024 chunks, ≤16 MiB encoded media, ≤4 million decoded pixels,
and **exact** zlib expansion length. Truecolor optional palettes (PLTE)
and keyed transparency (tRNS) are explicitly rejected rather than silently
rendered wrong. Only well-formed ancillary chunks with valid CRC are skipped.

A PNG CRC proves only file integrity under PNG's non-cryptographic CRC32;
it does **not** prove who created the artwork, that the media is original
or that it is free of copyright disputes or theft reports. SHA-256 of the
complete PNG bytes is included as a separate technical media identifier.

The decoder does not apply ICC/gamma/color profile correction, does not
support 16-bit, indexed PNG, progressive/interlaced PNG, APNG animation,
arbitrary raster sizes, JPEG or MP4. A perceptual-hash result, including
distance 0, remains **candidate_only**, with human review.

This module is NOT a production upload or internet-facing decoder.
Before handling untrusted user uploads, the system still requires an
**isolated worker process/container** with CPU, memory, file-size and
wall-clock limits; HTTPS/authz and consent gates; complete PNG/JPEG
support via reviewed native or sandboxed libraries; and per-medium
real-world calibration. Tests use synthetic fixtures and do not set
a production-safe Hamming threshold.
