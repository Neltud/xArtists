# xArt-ID — JPEG worker boundary

PNG lab decode is on main (#329). JPEG is **not** decoded in the API process.

## Why

JPEG decoders are historically a large attack surface (memory, CPU, partial streams).

## Gate

`artIdentityJpegGate.mjs` only detects SOI and returns `jpeg_decode_requires_isolated_worker`.

## Future worker requirements

- Separate **OS process/container** for untrusted JPEG decoding, with enforced CPU/memory/wall-clock/file descriptor limits. A Node `worker_thread` alone is **not a hard security boundary**: it shares the process and cannot reliably constrain native decoder crashes or all memory usage.  
- Input size cap aligned with Art-ID (≤16 MiB lab)  
- Output only RGBA frame → existing `computeArtPHash64V1`  
- No network egress from worker  
- Still `certified_authentic: false`  

Issue #324 remains open for calibration on consented works + C2PA.

## Current gate is not a decoder

The 3-byte JPEG SOI prefix is **only a heuristic**. A file beginning
`ff d8 ff` may still be invalid or malicious; the gate never accepts
or parses it. It returns a **refusal**, not a queued worker operation,
proof that decoding succeeded, or a security assessment.

A later worker implementation needs independent sandboxing, a pinned
reviewed decoder, image size/pixel checks, EXIF orientation handling,
ICC normalization policy, limits on decompression and decoded frame
count, failure telemetry without private image content, and a fully
authenticated/consented upload caller. Any pHash output remains
`candidate_only` with curator review, never `certified_authentic`.
