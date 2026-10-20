# Sites v3 reprise — status (2026-10-20)

## Cause of public UI lag

1. **PR #174** (`codex/xartists-sites-v3-exact`) merged **6 files only** — not the claimed 751-file Sites snapshot.
2. Branch tip `codex/xartists-sites-v3-exact` @ `2760ab8…` still lacks the full exact import; docs claimed local commits `4b2026d` / `73099d5` and bundle `xartists-sites-v3-exact.bundle` that are **not** in this agent environment.
3. Live https://neltud.github.io/xArtists/ serves `meta xartists-build=4.0.3-csp` matching committed `apps/frontend/index.html` **and** `docs/index.html` asset fingerprints (`index-CQ2QocDX.js`). A later Actions run that uploaded `./docs` can replace a successful Vite deploy from `static.yml`.

## What is already on main (design direction)

Documented in `DESIGN_VALIDATED_DELIVERY.md` and present in tree:

- `styles/soul-tokens.css` — graphite `#10120f`, acid green `#cdf58b`
- `config/routeRegistry.ts` — 5 spaces, aliases, NotFound path
- Musée / xPortal cycle notes (code review level)
- `base: '/xArtists/'` in `vite.config.ts`

This is **not** a pixel-certified import of https://xartists.loftypearl128.chatgpt.site/ (login wall; not inspectable here).

## This branch (`fix/sites-v3-import-and-pages`)

| Change | Purpose |
|--------|---------|
| `scripts/check-routes.mjs` | Real fail on missing critical routes / NotFound |
| `scripts/verify-site.mjs` | Post-build dist base `/xArtists/` check |
| `scripts/run-render-check.mjs` | Required modules + palette tokens |
| `static.yml` | Run those scripts; write `build-info.json` (sha, run_id, date); stamp dist meta |
| `index.html` | `xartists-build=0.117.0`, theme-color `#cdf58b` |

## Blocked without human artifact

- Recover **exact** Sites export (bundle or authorized archive) matching commit `8a607c8831234fe738a091a5a4caf325811c1b5b`.
- Push that tree onto this branch, re-run `npm ci && npm run build && npm run check:routes && npm run verify:site && npm run render:check`.
- Confirm GitHub **Pages source = GitHub Actions** only (`static.yml`), not branch `/docs`.

## After merge + deploy

1. Open `/xArtists/build-info.json` — SHA must match the frontend commit.
2. View-source: `xartists-build` ≥ `0.117.0`, not `4.0.3-csp`.
3. Hard refresh / unregister SW if stale.
4. Ensure no workflow republishes `docs/index.html` over the Vite artifact.
