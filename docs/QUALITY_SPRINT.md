# Quality sprint — ongoing

## Stabilized (2026-10-04)

- React #31: `asText` hardened for Zod-like `{min,max,list}` / API objects
- RCE strip + `loadRce` errors always string
- MatrixBoard cells always string
- LP page: all 4 TRO pools via `mergeTroPools`
- Marketplace: on-chain index + inventaire + isPayable banner
- LIA hub: aggregator + intent feed + shadow friction (paper)
- Studio: issue → mint → list path + liens Marketplace / Mes salles
- Beta runbook + deployer micro-proof docs

## Smoke (GitHub Pages)

| Asset | HTTP |
|-------|------|
| index.html | 200 |
| data/config.json | 200 (4 pools) |
| data/lia_status.json | 200 |

SPA routes (hash): `/`, `/marketplace`, `/lp`, `/lia`, `/staking`, `/studio`, `/my-packs`

## Known gaps (honest)

| Item | Status |
|------|--------|
| Market SC `isPayable: false` | See `docs/MARKET_PAYABLE_UPGRADE.md` |
| Proven user buy | `57b7b5e2…` success 0.25 EGLD |
| Slot REAL | House / gates — Fun path primary |
| Agents mint SC | soon |
| LIA live trading | Off — paper / Beta only |
| Automation ops | 1×/day 08:00 Paris |

## After each Pages deploy

1. Hard refresh mobile (cache SW)
2. Smoke routes above
3. Confirm no React #31
4. RCE totals load
5. 4 pool cards on `/lp`
