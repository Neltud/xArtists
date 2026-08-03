# Audit sécurité SC xArtists (synthèse ops)

Date: 2026-08-03 · Scope: agents-marketplace, nft-marketplace (repo code)

## Findings status

| ID | Sévérité | Item | Status code |
|----|----------|------|-------------|
| S1 | High | Upgrade / ownership only owner | ✅ require_owner |
| S2 | High | CEI active=false before transfers | ✅ |
| S3 | High | fee+royalty ≤ 100% NFT | ✅ |
| S4 | Med | claimFees accumulated_fees | ✅ |
| S5 | Med | Pause | ✅ |
| S6 | Med | 2-step transferOwnership | ✅ |
| S7 | Med | placeBid refund previous | ✅ code (redeploy!) |
| S8 | Low | Offer absent | ✅ intentional |
| S9 | High | agents SC not deployed | ❌ ops |
| S10 | High | Live SC codehash may lag repo | ⚠️ verify explorer |
| S11 | Med | No burn $TRO on sale yet | ❌ P0 optional |
| S12 | Med | Phygital escrow lock not in SC | ❌ P0 optional |
| S13 | High | Bridge experimental no user funds | ✅ labeled |

## Deploy rules

1. MAINNET only CHAIN=1  
2. Simulate before send  
3. PEM never in git  
4. Blackbox list/buy/cancel/claim (+bid)  
5. Write `data/contracts.json` only after confirmed deploy  
6. External paid audit before significant TVL  

## Residual risks

- Frontend signing bootstrap incomplete without WC login  
- Listing index partial (API txs)  
- Executor live depends on mxpy + PEM host security  
