# Mainnet production — ARCHIVED CLAIMS

> **2026-09-13 — P0 honesty patch (Claude audit alignment)**

This file previously (or in related docs) implied full mainnet production.  
**That is not the current state.**

## Authoritative status

See **[`docs/SOURCE_OF_TRUTH.md`](./SOURCE_OF_TRUTH.md)** and **`data/contracts.json`**.

| Claim | Reality |
|-------|--------|
| SCs live on mainnet | **No** — `codeHash` null |
| LIA executing live trades | **No** — `LIA_LIVE_TRADING=false`, paper |
| Production complete checklist | **Not met** |

## What *is* live

- **Demo UI** on GitHub Pages (paper-first banners)
- **Read-only** MultiversX mainnet (balances, explorer links)
- Optional **GrokyversX** ops bot (operator PEM, not product SC)

## When this file may say “production” again

1. Each listed SC has non-null `codeHash` on API  
2. `data/contracts.json` updated + verified  
3. LIA live path gated, tested, and explicitly enabled  
4. Human sign-off recorded in `DEPLOYMENT_LOG.md`  

Until then: **GO_DEMO only.**
