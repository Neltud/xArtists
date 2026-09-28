# SC venue-split

**Statut :** code mx-sdk ready · deploy **testnet** pour verify · mainnet seulement après audit + GO_LIVE.

## Split immuable (bps = 10_000)

| Bucket | bps | % |
|--------|-----|---|
| Institution | 4000 | 40 |
| Associations | 2000 | 20 |
| LIA treasury | 2500 | 25 |
| Holders pool | 1500 | 15 |

## Endpoints

- `init(institution, associations, lia, holders_pool)`
- `rentPay(tier_id)` payable EGLD
- `rentPayEsdt(tier_id)` payable single ESDT
- `setPaused(bool)` owner only
- views: `getSplitBps`, `getBuckets`, `getPaused`, `getTotalEgldRouted`

## Sécurité

- Pas de `setSplit` après init
- Pas de withdraw owner
- Pause = bloque nouveaux paiements uniquement
- PEM hors repo

## Deploy testnet

```bash
./scripts/deploy_venue_split_testnet.sh
```

Requires: `mxpy`, `SC_DEPLOYER_PEM`, addresses for 4 buckets.

## Mainnet

1. Audit  
2. Testnet verify codeHash  
3. Deploy mainnet  
4. Set `VITE_VENUE_CODEHASH_OK=true` only after explorer verify  
