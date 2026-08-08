# Frontend performance — xArtists

## Implemented

| Item | Detail |
|------|--------|
| Portfolio N+1 kill | No `/tokens/{id}` per token |
| Poll pause | `visibilitychange` + 90s |
| Vite chunks | `react` / `router` / `mx-sdk` |
| Lazy routes | all pages `React.lazy` |
| **Lazy MxDapp** | `TxShell` only on Market/Studio/Agents/Tip/Wallet/Staking/TRO |
| **Virtual grid** | `@tanstack/react-virtual` when ≥48 tiles |
| **Slim catalog** | ~280 KB → ~72 KB (`version: slim-1`) |
| Index + pages | `xartists_collections.index.json` + `public/data/collections/{id}.json` |
| Lighthouse CI | `.github/workflows/lighthouse.yml` post-deploy |

## Regenerate slim catalog

```bash
# keep a full dump optional:
# cp data/xartists_collections.json data/xartists_collections.full.json
node scripts/slim_collections.mjs
```

## Next (optional)

1. Load gallery from **index** first, then fetch `collections/{id}.json` on expand
2. Brotli precompress in deploy step for large JSON
3. Raise Lighthouse performance assert once TTI measured on real CDN
4. Deploy SC → remove SC banners (UX, not perf)
