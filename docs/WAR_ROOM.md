# War Room — post-launch ops

## Radar
- Explorer: balances Slot / Treasury / Staking
- `/go-live` Dust panel + tx log
- LIA mood strip + shadow fallback

## Shield
1. **Paper** — auto on hard TX fail (Safety Switch)
2. **Pause SC** — owner `setPaused(true)` → banner maintenance
3. **Hard** — disable Pages / DNS if critical

## Golden path
1. Stake TRO → dashboard
2. Spin Slot → house moves
3. Buy / list → museum ownership

## Why some buttons stay soft-locked
Build-time flags (`VITE_*_…_OK`) must be set in **GitHub Pages secrets** and the site **rebuilt**. If missing, UI stays in simulation for that module only — intentional fail-closed, not a broken SC.
