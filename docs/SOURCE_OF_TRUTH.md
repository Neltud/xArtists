---
hidden: true
noIndex: true
---

# Source of truth — xArtists status

**Updated:** 2026-09-24\
**Rule:** Communication and roadmaps **must not** claim production/mainnet deploy unless this file + live probe agree.

## Canonical sources (in order)

1. **`data/contracts.json`** — addresses, `codeHash` expectations, `ui_status.verdict`
2. **MultiversX API** — `GET https://api.multiversx.com/accounts/{address}` → `codeHash` null = **not deployed**. If the endpoint is **down**, treat as **unread / empty** (fail-closed), do not invent live.
3. **This document** — human summary
4. Roadmaps / TECHNICAL / ANALYSE\_\* — **secondary**; if they conflict, ignore them

## Current verdict

| Field                  | Value                                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**             | **GO\_DEMO**                                                                                                                                                                 |
| **Network**            | MultiversX mainnet (read) · **Supernova 600 ms live** (since 10 Sep 2026, epoch 2233)                                                                                        |
| **Product SCs**        | **Not deployed** (last-known `codeHash` null; accounts API **down** 24 Sep)                                                                                                  |
| **LIA\_LIVE\_TRADING** | **false** (paper board)                                                                                                                                                      |
| **Demo**               | https://neltud.github.io/xArtists/                                                                                                                                           |
| **Probe**              | 2026-09-24 \~04:32 UTC · epoch **2242** · `/stats` 200 · `/economics` `/accounts` `/tokens` **KO** · EGLD books \~$4.13 · LIA Ops last-known 2.09 EGLD / nonce 1468 (19 Sep) |

### Smart contracts (last verified 2026-09-19; unread 24 Sep)

| Contract                          | Address (short) | codeHash | Status            |
| --------------------------------- | --------------- | -------- | ----------------- |
| nft\_staking                      | `…xr8cl`        | null     | **NOT\_DEPLOYED** |
| tro\_governance                   | `…e0ca8`        | null     | **NOT\_DEPLOYED** |
| marketplace                       | `…8354t`        | null     | **NOT\_DEPLOYED** |
| nft\_minter                       | `…yztkn`        | null     | **NOT\_DEPLOYED** |
| agents\_marketplace               | —               | —        | **NOT\_DEPLOYED** |
| tro\_burn / rwa / treasury / slot | —               | —        | **NOT\_DEPLOYED** |

Addresses may exist as empty accounts. **Empty ≠ deployed.** Unread ≠ deployed.

## Separate workstreams (not status labels)

| Workstream             | Meaning                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| **Indexer recovery**   | Wait for `/accounts` 200 after v2.1.3.0 before any ops TX          |
| **SC deploy + verify** | Real wasm on-chain, then update `contracts.json`                   |
| **LIA executor**       | Replace stubs with signed execution behind `LIA_LIVE_TRADING`      |
| **GrokyversX**         | Host-side bot; PEM on operator; not “LIA production”               |
| **THE PULSE**          | Social signals layer; demo strip on Home                           |
| **Supernova**          | **Done on-network.** Timing auto-detect + post-date default 600 ms |
| **MX-8004**            | Manifest ready; register after indexer + Identity registry live    |

## Features not active (do not advertise as live)

* **ContrarianBrain** — not implemented as a live brain
* **GreenSmoke (GSN) signals** — labels/config exist; **not** wired as live trading inputs to LIA executor
* **Playwright E2E in CI** — do not claim green E2E until package + workflow proven
* **Primordial Slot claims** — paper bank only

## Forbidden wording until codeHash non-null + gates pass

* `PRODUCTION_MAINNET` for product SCs
* `Déployé` on SC tables without API proof
* `Production-ready` without checklist in `contracts.json` / this file
