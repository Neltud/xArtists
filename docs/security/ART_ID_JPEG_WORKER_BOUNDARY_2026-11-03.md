# xArt-ID — JPEG worker boundary

PNG lab decode is on main (#329). JPEG is **not** decoded in the API process.

## Why

JPEG decoders are historically a large attack surface (memory, CPU, partial streams).

## Gate

`artIdentityJpegGate.mjs` only detects SOI and returns `jpeg_decode_requires_isolated_worker`.

## Future worker requirements

- Separate process / worker_thread with hard memory + time limits  
- Input size cap aligned with Art-ID (≤16 MiB lab)  
- Output only RGBA frame → existing `computeArtPHash64V1`  
- No network egress from worker  
- Still `certified_authentic: false`  

Issue #324 remains open for calibration on consented works + C2PA.
