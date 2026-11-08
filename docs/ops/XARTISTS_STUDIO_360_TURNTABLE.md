# xArtists 3D Lab — artist photo turntable (Studio preview)

**Scope:** preview only, local to the artist's browser. No wallet connection, upload, file persistence, blockchain transaction, CID, or physical-authenticity certification is performed by this feature.

## How to use in Creator Studio

1. Photograph the sculpture around its horizontal axis. Minimum 4 views, maximum 36. Better coverage uses 12–36 **real** evenly spaced frames, fixed camera distance, a steady camera, uniform diffuse lighting and a matte background.
2. Select JPEG, PNG or WebP images (<= 16 MiB/image, <= 96 MiB total) in rotation order. Use the in-page ↑/↓ controls to correct any ordering.
3. Drag left/right on the preview, use keyboard arrows, image-step buttons, slider, zoom, or auto-rotate. Auto-rotate respects `prefers-reduced-motion` and stops when the page becomes hidden.
4. No upload occurs. The images are browser-local `blob:` URLs, revoked when changed or the component unmounts.
5. If the artist wants to publish a real 3D NFT, use the separate Studio upload and mint flow **after** proper IPFS storage, independent readback verification, model GLB MIME support and wallet signature gates. This turntable is a preview of photos, not a geometry generator.

## Why

Android Chrome opened a previous `viewer.html` through `content://media/external/file`; fetching a relative `.glb` from that context failed with `Failed to fetch`. The new photo turntable uses only in-memory browser object URLs for the user's selected files; it does not depend on a relative GLB, Three.js, or a public CDN.

An independent, downloadable N. TUDURI V10 demo has also been produced in the conversation: single HTML document with eight **AI-interpolated/illustrative** images plus four genuine reference photographs, a GIF and MP4 preview. **Those artist assets are not committed to Git** without explicit publication permissions and file hosting. When displayed publicly, label synthetic views clearly and never claim measured surfaces or a photogrammetric reconstruction.

## Acceptance / limits

- User can rotate local photos on mobile and keyboard; no payments and no wallet action.
- Reject unsupported MIME, zero-size files, more than 36 views and oversized sets.
- Respect motion accessibility and revoke object URLs.
- Current feature does not extract frames from MP4 and does not output GLB/UV textures. Video-frame extraction, geometric reconstruction and publication are separate work packages.
- No assumption that browser-local file URLs work on every Android `content://` file manager; the supported app route is HTTPS on xArtists.

## Verification

`node --test apps/frontend/tests/studio-photo-turntable.test.mjs` for static gates.
For runtime, use frontend build and real mobile browser checks. The independent V10 demo was exercised in Chromium's mobile viewport with the browser offline; no external requests or JS errors observed. This does **not** establish real-device Android validation.


## MP4 timeline extraction (2026-11-08 sprint extension)

The Studio preview also accepts a user-selected **local MP4**, validates size (up to 120 MiB) and video metadata (0.5–180 s), lets artists choose start/end seconds and 8/12/16/24/36 extracted still frames, and decodes in a 720-pixel canvas at JPEG quality 0.86. Progress, cancellation, timeout, object-URL cleanup and browser codec errors are handled without network upload or wallet involvement.

**Critical distinction:** timestamps are sampled uniformly in **time**, not in camera yaw. The original N. TUDURI 60-second HEVC video changes height, distance and orientation and includes handling/tilting and close-ups. Sampling all 60 seconds is not a faithful 360° turntable. The user must choose a steady orbit segment, correct view order and reject unusable images. The displayed degrees are indicative, not measured angles. Prefer a steady filmed orbit with constant distance, fixed object orientation and diffuse illumination for a credible turntable.

MP4 is a *container*; some browsers cannot decode HEVC/H.265 (including the original HEVC source). If playback fails, locally transcode to compatible H.264 (outside the browser) before importing. Unsupported codecs fail with an explicit message; the client does not silently claim extraction succeeded. Large original videos may consume substantial local resources even without upload.

Unit-test the pure sampling function with `node --test apps/frontend/tests/studio-video-frames.test.mjs`, and run frontend TS/build and real-device browser tests before merging. This does not reconstruct geometry, solve photogrammetry, export GLB or publish IPFS.
