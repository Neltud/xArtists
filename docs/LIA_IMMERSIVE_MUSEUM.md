# LIA Immersive Museum (xArtists)

**Status:** Foundation v1 (CSS 3D corridor + guided world tour) · Premium WebXR on roadmap.

## Spaces

| Space | Access | Content |
|-------|--------|---------|
| **Catzligue** | Free | Public catalog frames (MultiversX metadata) |
| **Mydee** | Wallet | User NFTs via `useUserAccount` API |
| **Visite guidée mondiale** | Free | Stops from `art_world_locations.json` + link to Tours map |
| **VR Core** | LIA Pass (pending) | Roadmap: R3F + `@react-three/xr` |

## Stack (v1 vs target)

- **v1 (shipped):** CSS `perspective` corridor, no Three.js npm dep (CI RAM-safe).
- **Target:** React Three Fiber + Cannon + WebXR, Spline assets, spatial audio.

## Security

- Museum **never** submits transactions.
- Purchases / mint go through existing Guardian + TransactionWatcher (no fake-success `setTimeout`).
- LIA Pass mint blocked until marketplace/minter `codeHash` live.

## Routes

- `/museum` · `/musee`
- Related: `/gallery`, `/tours`, `/studio`, `/wallet`
