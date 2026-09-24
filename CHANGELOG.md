# Changelog — xArtists

## [0.41.0](https://github.com/Neltud/xArtists/compare/v0.40.0...v0.41.0) (2026-09-24)


### Features

* **phase4:** enriched LIA manifest v6.1 + dynamic First 100 banner + Home checklist (B+C) ([fea1e92](https://github.com/Neltud/xArtists/commit/fea1e928254fb5231eb3832c392a6116b95866cc))
* Venue accounts (museum/artist/company) + BottomNav Trade/Comptes + corsPreferred MuseumPage ([3eb1c9f](https://github.com/Neltud/xArtists/commit/3eb1c9f8ebac4ab882b06607bfaaf8528bb6e24c))
* wire VenueAccount route in App.tsx ([c01b079](https://github.com/Neltud/xArtists/commit/c01b07937f03e7ab9655b89308a00ea28727d2c0))


### Bug Fixes

* **museum:** corsImage util + Met PD sculptures with remote photos ([15c6a8c](https://github.com/Neltud/xArtists/commit/15c6a8cf5a37a194f662fb043b27d726626de0ea))
* **museum:** proceduralSculptures with Met Open Access PD images ([d066564](https://github.com/Neltud/xArtists/commit/d066564785df532c705d170c7dcd47e0fc7c2780))

## [0.40.0](https://github.com/Neltud/xArtists/compare/v0.39.1...v0.40.0) (2026-09-24)


### Features

* **museum:** click artwork → approach + open credit dossier ([7ef6a08](https://github.com/Neltud/xArtists/commit/7ef6a08f173199d0737c4ee21d126c300686f6db))
* **slot:** 3×3 casino grid with MultiversX NFT images (paper bank) ([219c93b](https://github.com/Neltud/xArtists/commit/219c93b35c8a561ad700da285cbebc0f87ed84b4))
* **trading:** 10 colonnes compounding visibles + logique S1/S05/S2 détaillée ([a474ac9](https://github.com/Neltud/xArtists/commit/a474ac9dcb31975467ddc10ce569c27846bf6b40))

## [0.39.1](https://github.com/Neltud/xArtists/compare/v0.39.0...v0.39.1) (2026-09-24)


### Bug Fixes

* **museum:** 2D grid image fallback via images.weserv.nl ([6f1619a](https://github.com/Neltud/xArtists/commit/6f1619aeb3f91b4174e68be7c7ac46b12632696c))
* **museum:** load wall art via CORS proxy — media.multiversx lacks ACAO for WebGL textures ([ef33ebe](https://github.com/Neltud/xArtists/commit/ef33ebe4e297911222558976859af9c3459adc6f))
* **museum:** restore WebGL hall + CORS proxy (images.weserv.nl) for MultiversX textures ([81f4e66](https://github.com/Neltud/xArtists/commit/81f4e66c585b52843f5583cfc77f5fc0eae32e28))

## [0.39.0](https://github.com/Neltud/xArtists/compare/v0.38.2...v0.39.0) (2026-09-24)


### Features

* **probe,slot:** resilient mainnet probe + Primordial Slot + recap 24 Sep ([772cddb](https://github.com/Neltud/xArtists/commit/772cddb1e472493133463367b53e73d4fce9bf5a))

## [Unreleased]

### Features

* **probe:** resilient mainnet probe — `/stats` independent of `/economics` `/accounts` (post v2.1.3.0 indexer)
* **slot:** Primordial Slot paper UI restored (was PLACEHOLDER) + `/slot` route in App
* **demo:** 10-step tour (Slot + GO_LIVE) + API degraded gates
* **go-live:** indexer-healthy gate before any SC deploy

### Documentation

* **recap:** analyse dApp + veille **24 sept 2026** — epoch 2242, indexer partiel, EGLD ~$4.13, LIA Ops last-known 2.09 EGLD, SC unread/empty

## [0.38.2](https://github.com/Neltud/xArtists/compare/v0.38.1...v0.38.2) (2026-09-23)



### Documentation

* GrokyversX wallet custody doctrine — PEM ops-only, paper-first, creator controls funds with key ([a6fd041](https://github.com/Neltud/xArtists/commit/a6fd041f6e3fcf984437d2bee23b3ad21f7eec25))

## [0.38.1](https://github.com/Neltud/xArtists/compare/v0.38.0...v0.38.1) (2026-09-23)


### Bug Fixes

* **museum:** display NFTUDURI works — multi-source catalog, priority collections, 2D grid always visible ([f1de7e1](https://github.com/Neltud/xArtists/commit/f1de7e1dc8541f98c3d5256641f15b404174b996))
* **museum:** TextureLoader crossOrigin anonymous + TEX_CONCURRENT 8 ([d5edc76](https://github.com/Neltud/xArtists/commit/d5edc7610e46066d22873ef01ddc62067a3c13b4))

## [0.38.0](https://github.com/Neltud/xArtists/compare/v0.37.0...v0.38.0) (2026-09-23)


### Features

* MCP config example + integration hooks + xartists-mcp README ([9da4c22](https://github.com/Neltud/xArtists/commit/9da4c220af1799ad305d6d9d66f38ff1f789cbe2))
* **ui:** ArtAtelierBackdrop per-route themes + CrossAgentPanel + docs ([f9ac592](https://github.com/Neltud/xArtists/commit/f9ac59296829f708220491d165c9092d493d7e4d))
* **ui:** atelier.css page washes + CrossAgentPanel ([40203cb](https://github.com/Neltud/xArtists/commit/40203cb3d71c9bb5ffb3da11bf021941f70cddf6))
* **ui:** CrossAgentPanel for Grok↔LIA CrossScore + feedback ([061ca56](https://github.com/Neltud/xArtists/commit/061ca5637c5a9211a1cab225e474207d34a8e4b9))
* **ui:** unique page themes + MCP bridge + CrossAgentPanel + GrokMcpIngest ([3403450](https://github.com/Neltud/xArtists/commit/34034504161677bba2efc15f5c777ff519540cec))
* **vellum:** dapp_sync registry — pages, Guardian, strategies, TxShell vs LIA PEM ([9f764e2](https://github.com/Neltud/xArtists/commit/9f764e2a466f21ea5ce716e93da3c938c1e16a75))
* **vellum:** lia.vellum.dapp_sync module — page registry + Guardian/sign matrix ([7dfde2e](https://github.com/Neltud/xArtists/commit/7dfde2e8ce65a4d1bd6efe63054c343b8511d95e))

## [0.37.0](https://github.com/Neltud/xArtists/compare/v0.36.0...v0.37.0) (2026-09-23)


### Features

* **slot:** nav Slot/Sim + PRIMORDIAL_SLOT docs ([0ae3699](https://github.com/Neltud/xArtists/commit/0ae3699249d2025e4297f19ce9e08667469e9c71))
* **slot:** Primordial Slot live — scatter/RWA jackpot UI + /slot route + nav ([375782b](https://github.com/Neltud/xArtists/commit/375782b07cd9e1b6a28cac3fccdc9470297eb039))
* **slot:** Primordial Slot paper UI + /slot route + mobile nav Slot/Sim ([7e552cf](https://github.com/Neltud/xArtists/commit/7e552cfa9cc5749ba012e4b51939c1a05ec89e51))

## [0.36.0](https://github.com/Neltud/xArtists/compare/v0.35.2...v0.36.0) (2026-09-23)


### Features

* **phase4:** readiness banner, MX-8004 register skeleton, moltbot map, Vellum sync instructions ([bbc5239](https://github.com/Neltud/xArtists/commit/bbc52395556fc5449fe67967714635f871809050))
* production_run phase_mx8004_sprint (DRY_RUN=1 each sprint) ([a4bb879](https://github.com/Neltud/xArtists/commit/a4bb879342200ece53615592b4a4085db1bb5bbd))
* **ui:** atelier backdrop + dynamic Phase 4 + production_run mx8004 phase ([a6f3578](https://github.com/Neltud/xArtists/commit/a6f357803f450fd77e2eab5d6920d4c7c588c78f))
* Vellum MX-8004 sprint node, dynamic Phase 4 badge, atelier décor from NFTUDURI ([97f766d](https://github.com/Neltud/xArtists/commit/97f766d5de02719264960a189498b73ae348891d))

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
