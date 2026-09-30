# xArtists — LIVE status (truth)

Last review: front push 2026-09-30.

## What is actually live on MultiversX mainnet

| Module | Address / note | User TX |
|--------|----------------|---------|
| TRO staking | `erd1…pe3xf3` | Yes if `VITE_TRO_STAKING_CODEHASH_OK=1` (stake dust OK) |
| NFT marketplace | `erd1…8txmm` | Yes if `VITE_MARKETPLACE_CODEHASH_OK=1` |
| Venue split | `erd1…vje2y` | Yes if `VITE_VENUE_CODEHASH_OK=1` |
| Slot casino SC | `erd1…s4g34f` | **Deployed** — spin public only after fund + `VITE_SLOT_CODEHASH_OK=1` |
| Agent pack mint SC | pending | **Paper** (`/agents`, localStorage) |
| Command Center | front only | Gate by pack ownership (chain or paper) |
| MX-8004 / 8008 | paper bridge | No mainnet identity registry yet |

## Front (GitHub Pages)

- Repo: `Neltud/xArtists` → Pages after workflow **Deploy** succeeds.
- URL: `https://neltud.github.io/xArtists/`
- New features (Command Center, Slot bet/bonus, list NFT) need a green Pages build.

## Not fully “go live” yet

1. **Slot on-chain spins** — SC exists; UI is paper until secret + progressive EGLD fund + microtest.
2. **Pack mint SC** — paper purchase only.
3. **Fiat on-ramp / auto EGLD→TRO** — UI placeholders; no MoonPay keys in repo.
4. **Revenue splitter** — treasury SC address present; pack sale auto-split not wired to user mint flow.

## Honest product stance

- Stake TRO, list NFT (with owned NFT + CODEHASH), venue rent: **mainnet-capable** when secrets set.
- Slot fun + Command Center + packs: **playable paper**, SC path progressive.
- Never claim “all live” without CODEHASH + 1 real user TX explorer link.
