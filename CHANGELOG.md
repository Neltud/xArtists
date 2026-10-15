# Changelog — xArtists

## [0.109.0](https://github.com/Neltud/xArtists/compare/v0.108.2...v0.109.0) (2026-10-15)


### Features

* **cockpit:** Pack3DCockpit signals + fix mode crash + RWA-only market + home title ([fc14783](https://github.com/Neltud/xArtists/commit/fc1478330fe97df6225c12b2902e3e2a1d9df779))
* **marketplace:** wire Frameit Indexing + RWA Physical Art panel (v0.109.0) ([1584669](https://github.com/Neltud/xArtists/commit/1584669b413e1fa14f5a39e5e5ccdeea9eb3653c))
* mount Pack3DCockpit on Agents + LIA Hub; harden AgentNftOrb ([5865e83](https://github.com/Neltud/xArtists/commit/5865e83ced76bea2f52fa103c8ce271a0f5d2674))
* **packs:** Pack3DCockpit holographic signals console ([1d8b6c5](https://github.com/Neltud/xArtists/commit/1d8b6c5bb7772e42796bfb56cd5d05ea82879791))
* **rag:** ATC→TCA pipeline, ACTIVE_CONTEXT, setPackPrice workflow + local script ([642e1d4](https://github.com/Neltud/xArtists/commit/642e1d4c96d852d303ac3f56f40f4a67e733f077))
* **v0.109:** Frameit indexing API, RWA provenance metadata, market panel ([a5279a8](https://github.com/Neltud/xArtists/commit/a5279a88325ebf4a4c77d78406b0bb66d4e490aa))
* **v0.109:** FrameitMarketPanel + MuseumWebGL 60fps pause/frustum/context-loss ([f5b6739](https://github.com/Neltud/xArtists/commit/f5b6739cd99ed43a11a7f98f043f6829fd2aa1e8))


### Bug Fixes

* **cc:** DashboardSource pack fields name/icon + mode optional chain ([00e1c8d](https://github.com/Neltud/xArtists/commit/00e1c8dc34429a142169f33ed9156869cce0601b))
* **lia:** mount Pack3DCockpit + optional-chain mode/uniforms on LIA Hub ([e304a46](https://github.com/Neltud/xArtists/commit/e304a46096606287f38ee1f83cad2da5a5921d8a))
* **market+cc:** RWA-only market panel wiring, CC access/mode guards ([a13dfed](https://github.com/Neltud/xArtists/commit/a13dfed96c29a990ea03038b70c210e0ac7d0064))
* **market:** RWA Physical Art only (remove Frameit indexing UI copy) ([f103b95](https://github.com/Neltud/xArtists/commit/f103b951ab8e2d2050a0513329724090629129c3))
* **security:** audit S-01/S-02 — mainnet pack tickers, chain-only access, paper mint DEV-only ([34b7aa9](https://github.com/Neltud/xArtists/commit/34b7aa98abfb71797fcd9804cc5ebba2c4bb8ed3))
* **security:** chain-only markPackOwned/loadOwnedPacks + XAIPLS matching + DEV paper mint ([f78e993](https://github.com/Neltud/xArtists/commit/f78e993a612795d0812e6203793e6c7a13c9c7a3))
* **security:** mainnet PACK_COLLECTIONS + DEV-only paper mint + chain matching XAIPLS/XAIYLD/XAISNT ([8d69b61](https://github.com/Neltud/xArtists/commit/8d69b613f26af7de89afb395820568ee5ba7ed19))
* **security:** tickerToPackId XAIPLS/XAIYLD/XAISNT + DEV-only paper mint in useAgentPackTx ([678010c](https://github.com/Neltud/xArtists/commit/678010cb6d75c58360f47f6da9a6330f9eec977c))
* **ui:** institutional home copy, RWA-only market, CC mode guard, museum lights+art ([f10f323](https://github.com/Neltud/xArtists/commit/f10f32368328237d01406373db856b6919cc8ee5))
* **ui:** purge Slot from nav, home pack prices 10/5/2.5, cache bust 0.109.1 ([d8a83f0](https://github.com/Neltud/xArtists/commit/d8a83f063f4492252088f73a893cd9b24bf505c9))
* **ui:** remove Slot from product map, /slot redirect, version 0.109.1 cache bust ([03c6660](https://github.com/Neltud/xArtists/commit/03c6660e1e8c4dec4a682d27d002f3bdaf9edc47))


### Performance

* **museum:** restore MuseumWebGLHallLive + webglPause, frustumCulled, low-end DPR, context-loss 2D fallback ([263e9f2](https://github.com/Neltud/xArtists/commit/263e9f2d73b36c4d89d1ab4c621cadfaa117ddc5))
* **museum:** restore placeArt wall hangings + boost lighting + webglPause ([bff96b5](https://github.com/Neltud/xArtists/commit/bff96b59a51128c5c3cf8bd3a7fcc8680962ecb6))
* **museum:** webglPause on visibility, frustumCulled, low-end DPR, context-loss fallback ([09c8043](https://github.com/Neltud/xArtists/commit/09c80434211bf306f24b58a771af9329b77fc694))


### Documentation

* **mainnet:** update official SC pack prices to 10/5/2.5 EGLD ([2ba7027](https://github.com/Neltud/xArtists/commit/2ba7027d4853c59e0942ca95dd496cf814f21b91))
* release notes & CHANGELOG for v0.109.0 (Marketplace RWA/Frameit, Museum 60fps, zero-trust packs) ([d0a1f33](https://github.com/Neltud/xArtists/commit/d0a1f333eb81b094143e8d74649ddaae8712e0a5))
* restore full CHANGELOG under v0.109.0 (history from pre-truncate) ([b2d36f1](https://github.com/Neltud/xArtists/commit/b2d36f1ab5acd01ff67b595f81821d29de2e109a))

## [0.109.0](https://github.com/Neltud/xArtists/compare/v0.108.2...v0.109.0) (2026-10-15)

### Features

* **marketplace:** wire Frameit Indexing + RWA Physical Art panel on `/marketplace` ([1584669](https://github.com/Neltud/xArtists/commit/1584669b413e1fa14f5a39e5e5ccdeea9eb3653c))
* **frameit:** secondary-market floor + Frameit/Xoxno deep-links for `XAIPLS-2cf72b` · `XAIYLD-987e24` · `XAISNT-3d8a6b` (`frameitApi.ts`, `FrameitMarketPanel.tsx`)
* **rwa:** provenance schema — dimensions, medium, NFC chip ID, on-chain certificate (`rwaMetadata.ts`)
* **museum:** WebGL perf — frustum culling, `webglPaused` on background, context-lost → 2D fallback, dispose on unmount (`MuseumWebGLHallLive.tsx`)

### Security

* **access:** zero-trust pack rights — on-chain ESDT/SFT possession only (no `localStorage` grant path)
* **packs:** mainnet tickers aligned in `packNftMetadata.ts`; `mintPaper` restricted to DEV

### Economy (mainnet)

* **sc:** pack prices via `setPackPrice` — Pulse 10 EGLD · Yield 5 EGLD · Sentinel 2.5 EGLD (LIA Vellum trading wallet feed)

### Docs / RAG

* **docs:** `docs/RELEASE_NOTES_v0.109.0.md`
* **rag:** automated ingestion (`rag-ingestion.yml`) + shared memory sync (`ACTIVE_CONTEXT.md`)

## [0.108.2](https://github.com/Neltud/xArtists/compare/v0.108.1...v0.108.2) (2026-10-14)


### Documentation

* **sc:** pack collections configured — ESDTRoleNFTCreate + setPackCollection verified live ([04446fd](https://github.com/Neltud/xArtists/commit/04446fdf13aefabe5b82a5dbb734f331c7db2d77))

## [0.108.1](https://github.com/Neltud/xArtists/compare/v0.108.0...v0.108.1) (2026-10-14)


### Bug Fixes

* **ci:** configure existing XAIPLS/XAIYLD/XAISNT — skip re-issue ([677e3df](https://github.com/Neltud/xArtists/commit/677e3dfea9d95e78411d0b012f0e6f056625db84))
* **ci:** UserPEM Path + DEPLOYER env for issue pack collections ([8c2ec74](https://github.com/Neltud/xArtists/commit/8c2ec74798e7bc796b35d563ab903feb6f14e8e7))


### Documentation

* **sc:** agents-marketplace buyPack upgrade confirmed mainnet — collections pending ([5ae9494](https://github.com/Neltud/xArtists/commit/5ae9494b82db7e3ff0035a3a2c3cefa7443ab341))

## [0.108.0](https://github.com/Neltud/xArtists/compare/v0.107.0...v0.108.0) (2026-10-14)


### Features

* **onchain:** 1 pack purchase = 1 ESDT NFT — nftService, buyPack TX, collection match ([7a2f225](https://github.com/Neltud/xArtists/commit/7a2f22563306e66a3e48b2d640f6ada980e26f2e))
* **onchain:** buyPack TX 1 pack = 1 ESDT NFT + monitor + waitForPackNft ([3131516](https://github.com/Neltud/xArtists/commit/31315165dd469e3e72467e7718f906c8f6747542))
* **onchain:** CheckoutModal crypto rail calls buyPack for 1 pack = 1 ESDT NFT ([8812ab1](https://github.com/Neltud/xArtists/commit/8812ab1b3993314fd2a0033d6cd8b3e026c87c1f))
* **onchain:** map xAiAx/xAiAy/xAiAs collections to Pulse/Yield/Sentinel packs ([bc12037](https://github.com/Neltud/xArtists/commit/bc12037b68e575bfce82bfef1ed112a90bcd1457))
* **sc:** agents-marketplace buyPack — mint ESDT NFT to buyer on EGLD payment ([5ffce3d](https://github.com/Neltud/xArtists/commit/5ffce3d9ca8c22940944af2d4a902d4dc94e2f1d))
* **sc:** buyPack endpoint — esdt_nft_create + transfer NFT to buyer ([1d9e2b3](https://github.com/Neltud/xArtists/commit/1d9e2b33734b90bed58a20c04634c4bed5666fe7))


### Bug Fixes

* **ci:** mxpy upgrade uses --nonce (not --recall-nonce) for agents-marketplace ([23c64e2](https://github.com/Neltud/xArtists/commit/23c64e2c09a146774f2dfc82245d57e6ee70cfa3))

> **Note:** Full historical CHANGELOG (≤0.107.x) is preserved in git at commit `1584669` / blob `04579e23`. To restore the long form: `git show 1584669:CHANGELOG.md`. The v0.109.0 section above is authoritative for this release.
