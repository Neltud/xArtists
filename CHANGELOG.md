# Changelog — xArtists

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

<!-- Historical entries retained in git history; truncated for push size. Full log: previous CHANGELOG revisions. -->
