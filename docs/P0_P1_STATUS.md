# P0 / P1 status — 2026-08-03

| Item | Status | Notes |
|------|--------|-------|
| Bootstrap `__xartistsSendTx` | **Code done** | `bootstrapSendTx` + MxDappProvider; needs real login/sdk for production sign |
| Deploy agents_marketplace | **Ops open** | null in contracts.json |
| Redeploy nft-marketplace (bid) | **Ops open** | Code in repo; live SC must match |
| Verify marketplace on-chain | **FE helper** | `verifyScOnExplorer` + MarketplaceActivity |
| UI acceptBid / withdrawBid / cancel | **Code done** | useMarketplaceTx + modal tabs |
| Index listings | **Partial** | Recent SC txs API — not full listing table |
| Upload Pinata Studio | **Backend only** | `lia.media.storage` + PINATA_JWT Vellum |
| Swap in-dApp | Deferred | External links |

## Still requires human ops

1. Mainnet deploy agents + write address
2. Redeploy/upgrade marketplace with placeBid codehash
3. Full sdk-dapp login (xPortal WC) for reliable sign
4. Vellum: `python -m lia.vellum.next_run` + push JSON
