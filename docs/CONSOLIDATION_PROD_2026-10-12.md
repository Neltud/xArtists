# Consolidation production — 12 Oct 2026

## Livré

| Chantier | État |
|----------|--------|
| Mode Pitch | Header toggle + `pitchMode.ts` + CSS `body.pitch-mode` |
| Glass modales | `.xa-modal-panel` dans `index.css` |
| Prix cache TTL 300s | `priceService.ts` |
| WebGL dispose + loader | `MuseumWebGLHallImpl.tsx` |
| Stake TRO / NFT | `TroStakePanel`, `AgentNftStakePanel`, `DeFiBuilder` |
| DAO voting power | `DaoGovernance` : TRO + SFT |
| Cert phygital | `PhysicalNftCertifier` + print A4 (voir patch) |
| **Finance Computer badge** | **NON** — pas de mention avant partenariat officiel |

## Ops

```bash
cd apps/frontend && npm ci && npm run build
```
