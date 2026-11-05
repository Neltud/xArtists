# Marketing claims map — GO LIVE safe

Historical claims matrix from 2026-11-03. Before publishing, verify the current deployed SHA and routes plus `/health`, independently of #281 S1/S2 and #328. A configuration value does not prove paid settlement, delivery or safe production operation.

| Claim | Allowed? | Condition |
|-------|----------|-----------|
| dApp public browsing | ✅ after checking | Exact deployed build, main routes and assets verified (HTTP 200 alone is insufficient) |
| LIA paper snapshots (not financial advice) | ✅ with status | Source timestamp and freshness shown, trading off; never call stale signals live |
| Packs Pulse / Yield / Sentinel presented | ✅ | prices 110/75/50 € catalogue |
| PayBox configuration present | ✅ only as configuration | `paybox_configured` does not prove S1 signed settlement or public checkout readiness |
| “Buy with card now” | ❌ until | Independent #281 payment/delivery/refund proof + security review + operator GO; flag alone insufficient |
| “NFT delivered when you pay” | ❌ | never without S1+S2 proven path |
| “Mainnet mint open” | ❌ | #310 deny + mint_live false |
| “LIA auto-trades your portfolio” | ❌ | flag 0 |
| “$TRO bridge to Solana live” | ❌ | bridge off |
| Whop membership = Genesis NFT | ❌ | services only |

## Launch kit line (safe)

> xArtists is live: explore packs, museum, and LIA signals. Card checkout and on-chain pack mint open in controlled phases — payment never silently equals NFT delivery.
