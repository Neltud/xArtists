# Frontend performance — xArtists

## Implemented

| Item | Detail |
|------|--------|
| Portfolio N+1 kill | No `/tokens/{id}` per token |
| Poll pause | `visibilitychange` + 90s |
| Vite chunks | `react` / `router` / `mx-sdk` / `virtual` |
| esbuild drop | `console` + `debugger` in CI/prod |
| Lazy routes | all pages `React.lazy` |
| **Lazy MxDapp** | `TxShell` dynamic import on TX routes only |
| **Virtual grid** | `@tanstack/react-virtual` when ≥48 tiles |
| **Slim catalog** | ~280 KB → ~72 KB (`version: slim-1`) |
| **Progressive gallery** | index ~16 KB → `collections/{id}.json` on expand |
| **SW v3** | shell cache-first · data/API network-first |
| **LazyImage** | decode async + fade + error fallback |
| **RoutePrefetch** | idle-time prefetch Gallery/Market/Portfolio/Trading |
| Lighthouse CI | post-deploy warn thresholds |

## Regenerate slim catalog

```bash
node scripts/slim_collections.mjs
```

## Measure

```bash
# after Pages deploy
# Actions → Lighthouse CI (Pages) → workflow_dispatch
```

## Still optional

1. WebP CDN for NFT thumbs (depends on media hosts)
2. Mission/Reserve wallets (product, not perf)
3. Deploy SC → remove SC banners (UX)
