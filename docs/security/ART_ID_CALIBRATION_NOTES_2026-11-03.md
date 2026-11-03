# xArt-ID calibration notes (synthetic, 2026-11-03)

## Default threshold

`compareVisualHash64V1` / rank default **Hamming ≤ 8 / 64 bits** is a *lab starting point* only.

| Fixture | Expected |
|---------|----------|
| Same layout, different resolution | distance 0 |
| Vertical vs horizontal blocks | distance > 8 |
| Flat gray | `phash64=null`, quality `low_information` |

## Before any public Studio badge

1. Run calibration on **consented** artist works (crop, recompress, resize).  
2. Measure false-positive rate at thresholds 6 / 8 / 10 / 12.  
3. UI copy must say **candidate for human review**, never authentic / not stolen.  
4. C2PA and stolen-art registries stay separate, read-only, non-automatic.

## Related code

- `artIdentityVision.mjs` — DCT pHash  
- `artIdentityPngDecode.mjs` — PNG lab decode  
- issue #324  
