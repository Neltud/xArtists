# Changelog — xArtists

## [0.35.2](https://github.com/Neltud/xArtists/compare/v0.35.1...v0.35.2) (2026-09-23)


### Documentation

* Phase 4 / First 100 MX-8004 alignment + status 23 Sep (mainnet recovery hardfork) ([68fdbe2](https://github.com/Neltud/xArtists/commit/68fdbe25d45b14ff005237b678dee22876e0e4f9))

## [0.35.1](https://github.com/Neltud/xArtists/compare/v0.35.0...v0.35.1) (2026-09-22)


### Bug Fixes

* **build:** export LIA_HOST_LINES for LiaHost (unblock Vite CI) ([89a78f7](https://github.com/Neltud/xArtists/commit/89a78f7e0856dc863653008040020049e2954efd))
* **build:** stub MultiplayerScene without @react-three/fiber (unblock Vite CI) ([0772d30](https://github.com/Neltud/xArtists/commit/0772d303d3a2cad0ed9278a27f0045d2f4292a11))
* **css:** [@import](https://github.com/import) fonts first + page-transition classes ([5696fb8](https://github.com/Neltud/xArtists/commit/5696fb835f688a752971eb7a8187315684129245))

## [0.35.0](https://github.com/Neltud/xArtists/compare/v0.34.0...v0.35.0) (2026-09-22)


### Features

* **front:** P0 PageTransition + SoundDock ([2a4d169](https://github.com/Neltud/xArtists/commit/2a4d169fd3181c134d557a1ba740d1a97cdb9623))
* **front:** P0 part1 — SalePage, transitions, SFX, action feed, rights core ([cc73302](https://github.com/Neltud/xArtists/commit/cc73302b978caa52759072ef6acc4bdccd85733c))
* **front:** P0 rights lib, CopyrightBlock, OpsHud, JoyNotes, hooks ([b319c21](https://github.com/Neltud/xArtists/commit/b319c210427f4ff60e051b48bf63fcf00d8fe31d))
* **front:** wire SalePage, PageTransition, SoundDock in App ([ec5ba31](https://github.com/Neltud/xArtists/commit/ec5ba313a0b615e29e622d1f55080fc5c63cd84e))


### Bug Fixes

* **ci:** Setup Node without package-lock cache (unblocks Pages deploy) ([b3b2b52](https://github.com/Neltud/xArtists/commit/b3b2b52a0e33a491969cd26b3b2445766a062b3b))
* **front:** SalePage full content (replace PLACEHOLDER) ([fdd6619](https://github.com/Neltud/xArtists/commit/fdd6619d6a28b464c4c3e05fe14baabbaec7eb58))

## [0.34.0](https://github.com/Neltud/xArtists/compare/v0.33.0...v0.34.0) (2026-09-19)


### Features

* **demo:** live mainnet probe, GO_LIVE checklist, recap 19 sept ([93ea4ff](https://github.com/Neltud/xArtists/commit/93ea4ff40eab2fedb2d541111d644de5adbeef7d))

## [Unreleased]

### Features

* **probe:** live mainnet `/stats` `/economics` `/accounts` — epoch & LIA balance no longer frozen
* **demo:** `/demo` gates live (codeHash, LIA funded) + étape 09 GO_LIVE
* **home:** NetworkLiveStrip (epoch, EGLD, LIA Ops, market empty)
* **go-live:** route `/go-live` — checklist opérateur honnête
* **gates:** `assertTreasuryDest` fail-closed

### Documentation

* **recap:** analyse dApp + veille 19 sept 2026 — epoch 2241, EGLD $4.09, LIA Ops 2.09 EGLD (P0 fund fait), SC toujours empty

## [0.33.0](https://github.com/Neltud/xArtists/compare/v0.32.0...v0.33.0) (2026-09-17)


### Features

* **demo:** tour GO_DEMO /demo + recap 17 sept + fix supernovaBannerText ([fcef003](https://github.com/Neltud/xArtists/commit/fcef003ab3d23ed17110633db151ecd5cf708a40))


### Documentation

* recap dApp 17 sept + walkthrough /demo + route App ([efaa895](https://github.com/Neltud/xArtists/commit/efaa89583df86d5feac0469ef46829541a24d2a0))

## [0.32.0](https://github.com/Neltud/xArtists/compare/v0.31.0...v0.32.0) (2026-09-15)


### Features

* **pulse-layer:** THE PULSE — ingestion, sentiment, signal bridge boilerplate ([eb9a82e](https://github.com/Neltud/xArtists/commit/eb9a82e28e1b3b8f2f0660c7493c7ea9f29470a1))
* **pulse:** v2 ENVIRONMENT_UPDATE + categories + demo PulseStrip on Home ([f8b7ae3](https://github.com/Neltud/xArtists/commit/f8b7ae35b038adf554878003961f90c061432d62))


### Bug Fixes

* **P1.1:** nodes UniversalExecutor gates via resolve_mode (auto ([1989f96](https://github.com/Neltud/xArtists/commit/1989f9641b10ccd2bb0dec46257a4f0606d0b35c))
* **P1.1:** nodes UniversalExecutor uses resolve_mode (auto never silent live) ([8ae020f](https://github.com/Neltud/xArtists/commit/8ae020f2cfafe80118358f3c33ad8c919347))


### Documentation

* **marketing:** draft X 2026-09-12 23:00 CEST — board paper LIA ([a9d7954](https://github.com/Neltud/xArtists/commit/a9d795452d3ea25325dc2731c2a847cfc95cfc1b))
* **P0:** honest GO_DEMO status — contracts.json SoT; deprecate redundant Pages workflows; GSN/Contrarian not active ([f2d4cb1](https://github.com/Neltud/xArtists/commit/f2d4cb1007aeaadd4f41e239c8ca7b06b1cfa26d))
* Supernova status update epoch 2237 · refreshRate 600ms (2026-09-15) ([9bf2ed7](https://github.com/Neltud/xArtists/commit/9bf2ed780e3e4623fb9812e7ffe7ee6f051aae20))
