# Changelog

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
