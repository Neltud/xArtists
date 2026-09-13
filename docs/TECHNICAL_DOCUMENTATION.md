# Technical documentation — status header (P0)

> **Status: GO_DEMO** — not “Production Mainnet”.  
> **Source of truth:** [`SOURCE_OF_TRUTH.md`](./SOURCE_OF_TRUTH.md) · [`../data/contracts.json`](../data/contracts.json)

## Smart contracts mainnet

Do **not** trust static “Déployé” tables. Probe:

```bash
curl -s https://api.multiversx.com/accounts/ADDRESS | jq .codeHash
# null → NOT_DEPLOYED
```

| Contract | Role | Deploy status (2026-09-13) |
|----------|------|------------------------------|
| nft_staking | Staking NFT | **NOT_DEPLOYED** |
| tro_governance | Governance | **NOT_DEPLOYED** |
| marketplace | NFT market | **NOT_DEPLOYED** |
| nft_minter | Mint | **NOT_DEPLOYED** |

Full addresses: `data/contracts.json`.

## LIA

- Board / paper decision pipeline may exist  
- **Executor live signing = separate workstream**  
- `LIA_LIVE_TRADING` must stay false until executor + risk gates are real  

## Brains / signals

| Name | Doc status |
|------|------------|
| ContrarianBrain | **Not active** (not implemented as live module) |
| GreenSmoke / GSN | Config/labels only — **not** live feed into executor |
| THE PULSE | Demo + host package `packages/pulse-layer` |

## Yield / compounding claims

Any × large “$3 → $1M” style targets are **not** technical guarantees.  
Remove from public-facing copy; keep scenarios educational only.

## Frontend demo

https://neltud.github.io/xArtists/
