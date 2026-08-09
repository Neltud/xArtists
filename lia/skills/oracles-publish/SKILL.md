---
name: lia-oracles-publish
description: Refresh on-chain-leaning EGLD/token prices and mirror for the dApp.
---

# Oracles publish

## Steps

```bash
python -m lia.oracles.publish
```

Writes:

- `data/oracle_prices.json`
- `data/egld_price.json`
- mirrors under `docs/data/` and `apps/frontend/public/data/`

## Policy

- Prefer MultiversX economics + `/tokens/{id}`
- CoinGecko is secondary (lower weight)
- Max deviation / max age: `data/oracle_config.json`

## Do not

- Treat $TRO USD mark as treasury cash
- Execute trades solely on a single stale source
