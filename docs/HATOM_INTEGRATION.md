# Hatom Protocol integration

## Status

| Layer | Status |
|-------|--------|
| Wallet H-tokens (MVX API) | **Live** |
| Official Hatom HTTP API | Tried multi-path; often 404/DNS — soft fail |
| UI `/hatom` | Uses `useWalletTokens` API-first then wallet |
| LIA yield sleeve signal | `hatom_yield_signal` + live APY when markets API works |
| Publish | `python -m lia.vellum.publish_hatom` → `data/hatom_lia.json` |

## Code

- `lia/venues/hatom.py` — position + markets + sleeve_summary
- `lia/venues/mvx.py` — hatom_yield_signal
- `apps/frontend/src/hooks/useWalletTokens.ts` — UI fetch
- `apps/frontend/src/services/hatomService.ts` — legacy snapshot

## Policy LIA

- Yield sleeve (30% of wins) can target Hatom **supply** (USDC/EGLD), not aggressive borrow
- No forced leverage; HF display only when API provides it
- Settlement remains MultiversX

## Ops

```bash
python -m lia.venues.hatom
python -m lia.vellum.publish_hatom
```

If Hatom publishes a stable OpenAPI base URL, add it first in `HATOM_API_CANDIDATES`.
