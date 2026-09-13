# Source of truth — xArtists status

**Updated:** 2026-09-13  
**Rule:** Communication and roadmaps **must not** claim production/mainnet deploy unless this file + live probe agree.

## Canonical sources (in order)

1. **`data/contracts.json`** — addresses, `codeHash` expectations, `ui_status.verdict`
2. **MultiversX API** — `GET https://api.multiversx.com/accounts/{address}` → `codeHash` null = **not deployed**
3. **This document** — human summary
4. Roadmaps / TECHNICAL / ANALYSE_* — **secondary**; if they conflict, ignore them

## Current verdict

| Field | Value |
|-------|--------|
| **Status** | **GO_DEMO** |
| **Network** | MultiversX mainnet (read) |
| **Product SCs** | **Not deployed** (`codeHash` null on reserved addresses) |
| **LIA_LIVE_TRADING** | **false** (paper board) |
| **Demo** | https://neltud.github.io/xArtists/ |

### Smart contracts (2026-09-13 probe)

| Contract | Address (short) | codeHash | Status |
|----------|-----------------|----------|--------|
| nft_staking | `…xr8cl` | null | **NOT_DEPLOYED** |
| tro_governance | `…e0ca8` | null | **NOT_DEPLOYED** |
| marketplace | `…8354t` | null | **NOT_DEPLOYED** |
| nft_minter | `…yztkn` | null | **NOT_DEPLOYED** |
| agents_marketplace | — | — | **NOT_DEPLOYED** |
| tro_burn / rwa / treasury | — | — | **NOT_DEPLOYED** |

Addresses may exist as empty accounts. **Empty ≠ deployed.**

## Separate workstreams (not status labels)

| Workstream | Meaning |
|------------|--------|
| **SC deploy + verify** | Real wasm on-chain, then update `contracts.json` |
| **LIA executor** | Replace stubs with signed execution behind `LIA_LIVE_TRADING` |
| **GrokyversX** | Host-side bot; PEM on operator; not “LIA production” |
| **THE PULSE** | Social signals layer; demo strip on Home |

## Features not active (do not advertise as live)

- **ContrarianBrain** — not implemented as a live brain
- **GreenSmoke (GSN) signals** — labels/config exist; **not** wired as live trading inputs to LIA executor
- **Playwright E2E in CI** — do not claim green E2E until package + workflow proven

## Forbidden wording until codeHash non-null + gates pass

- `PRODUCTION_MAINNET` for product SCs  
- `Déployé` on SC tables without API proof  
- `Production-ready` without checklist in `contracts.json` / this file  
