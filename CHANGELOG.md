# Changelog — xArtists

Format: [Keep a Changelog](https://keepachangelog.com/). Versions suivent SemVer.

## [3.3.0] — 2026-08-29

### Added
- **Art Tours** : carte mondiale interactive (`ArtWorldMap`) — 12 villes d’art
- Data `art_tour_locations.json` (lat/lng, venues, scores)
- **TransactionMonitor** : poll API MultiversX réelle (pas de faux succès)
- **TxMonitorPanel** sur `/trading`
- **MultiversXExecutionAdapter** (ex-VellumAdapter renommé — Vellum = orchestration IA seulement)
- Core v3 : `doctrine.ts` · `multiversXService.ts` · `intent.ts` · `useLIA.ts`
- Wallet Web callback live (`/#/wallet`)
- Docs : `TX_MONITORING.md`, `ART_TOURS_MAP.md`, `V3_PRODUCTION_CORE.md`, `PUBLISH_v3.0.2.md`

### Changed
- Page **Agents** = packs **Pulse · Yield · Sentinel** uniquement
- Travel / Art Tours **retirés** de la page Agents (service séparé `/tours`)
- Marketing kit : Vellum n’est plus décrit comme un DEX

### Security
- Doctrine : SYNTAXE · SÉCURITÉ · PARAMÈTRES · ASSET
- Montants atomic string (BigInt-safe)
- Live trading gated (`VITE_LIA_LIVE_TRADING`)
- Hash `FAKE*` refusés par le moniteur TX

### Demo
- https://neltud.github.io/xArtists/
- Verdict : **GO_DEMO** · **NO-GO** volume fonds / SC mint

## [3.2.0] — tag `v3.2.0-final-production`

Production packaging tag (historique repo).

## [3.0.0] — tag `v3.0.0`

Baseline v3.

## [2.8.0-demo-live] — 2026-08-27

Première release GitHub « demo live » publiée.
