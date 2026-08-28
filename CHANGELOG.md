# Changelog

## [2026-08-28] — recap + honesty + veille

### Fixed
- Marketplace / Gallery badges: no fake live-dot while SC codeHash is null
- `contracts.json`: staking / governance / minter probed empty (same as marketplace)
- DataHealthStrip local Vite: `compounding_echelons.json` + `lia_signal_fusion.json` in `public/data`
- Private strip: node-upgrade countdown (1 Sep) + activation (10 Sep)

### Docs
- `ANALYSE_DAPP_COMPLETE.md` recap + tech watch **28 Aug 2026**
- `STATUS.md` / `STATUS_2026-08-28.md` / ROADMAP countdown **J-4 / J-13**

### Unchanged (intentional)
- `LIA_LIVE_TRADING=0`
- Do not merge Dependabot Vite 8 / ESLint 10 / Vitest 4 without smoke
- Do not set `VITE_SUPERNOVA=1` on Pages before 10 Sep 2026

---

## [v2.8.0-demo-live] — 2026-08-27

### Added
- Entity map page (`#/entity`) + `data/entity_map.json`
- Live network snapshot (MultiversX economics + LIA ops balance)
- Simulation Lab, Intent bar, Paper Soul Score, LIA Monitor
- Risk Manager paper + production_run phase
- DEMO mode banner + PRODUCTION_LIVE docs

### Fixed
- GitHub Pages deep-link load failures → **HashRouter**
- Vite production build (sdk-dapp / Ledger BLE) → stable TxShell stub
- SPA `404.html` fallback in deploy workflow
- ErrorBoundary + PageLoader timeout for stuck routes

### Security / ops
- No secrets in frontend
- Marketplace gated on codeHash
- LIA_LIVE_TRADING remains 0

### Known limits
- SC marketplace / agents not deployed
- Paper trading only

---

## Earlier

See git history and prior release notes in `docs/`.
