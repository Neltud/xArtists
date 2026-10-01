# xArtists frontend — Architecture v2 (incremental)

## Status

| Step | State |
|------|--------|
| 1. listNft ABI (price, royalty_bps, royalty_receiver) | DONE — `useMarketplaceTx` |
| 2. Folder target (Atomic / feature) | SCAFFOLD — barrels only |
| 3. Design tokens + Toast | DONE |
| 4. Phase 9 features | BLOCKED until 1–3 stable on live |

## Why no big-bang move

`src/components` has 150+ files imported from pages, App, and lab.
Moving them in one commit breaks Pages + HashRouter.

Target tree (new code **goes here**; old paths stay until file-by-file migrate):

```
src/
  assets/
  components/
    ui/          # Button, Toast, AssetDrawer, TransactionOverlay
    layout/      # barrels → Header, BottomNav
    features/    # barrels → marketplace / slot / packs
  context/
  hooks/
  services/
  styles/        # tokens.css
  types/
  utils/
```

Existing imports (`../components/Header`) remain valid.
