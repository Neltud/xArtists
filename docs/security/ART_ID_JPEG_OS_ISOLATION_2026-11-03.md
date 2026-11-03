# xArt-ID — JPEG OS-level isolation (#324)

**Context:** main has PNG lab decode + `artIdentityJpegGate` (in-process JPEG refused). PR #330 clarified that a Node `worker_thread` alone is not adequate isolation for an untrusted native JPEG stack.

## Goal

Decode JPEG → bounded RGBA → existing `computeArtPHash64V1` without:
- authenticity certificates  
- public unauthenticated upload endpoints  
- shared-process memory corruption risk from a hostile JPEG  

## Required boundary (lab → later prod)

| Control | Requirement |
|---------|-------------|
| Process | Separate OS process (not only worker_thread), preferably container/job with seccomp/landlock if available |
| Memory | Hard RSS cap (e.g. 256–512 MiB) + file size ≤ 16 MiB |
| Time | Wall-clock kill (e.g. 5–10 s) |
| Network | No egress |
| FS | Read only input path / stdin; write only stdout pipe |
| Output | Strict schema: `{width,height,rgba_length}` + raw RGBA bytes; reject if `width*height*4 ≠ rgba_length` |
| Trust | Parent treats output as **untrusted pixels**; still `certified_authentic: false` |

## Non-goals

- Shipping libjpeg into the Render API process  
- Auto-flagging stolen art  
- C2PA validation inside the JPEG process (separate verifier later)  

## Acceptance for “JPEG lab enabled”

1. Hostile/truncated fixtures do not crash the parent API  
2. Golden RGBA from a known JPEG matches pHash stability tests  
3. Gate module remains the only entry; API process never links decoder  
4. Docs + issue #324 updated with measured false-positive notes on consented works  

## claimPack interaction

None. Chain-id #328 and JPEG isolation are independent tracks.
