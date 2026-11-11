---
hidden: true
noIndex: true
---

# Deep TX path — List / Buy / Bid (xArtists)

## Gates (all must pass)

1. **SC live** — `VITE_MARKETPLACE_ADDRESS` = real erd1 **and** ≠ known empty placeholder **and** `VITE_MARKETPLACE_CODEHASH_OK=1`
2. **Wallet user** — not LIA ops · not paste\_readonly · not PEM
3. **Signature** — `window.__xartistsSendTx` after TxShell bootstrap (Market route loads sdk-dapp)
4. **Listing ID** — from `listings_index.json` match (token\_id + nonce) or manual / activity hint
5. **Offer** — no endpoint (V2 escrow deferred)

## Receiver safety

`useMarketplaceTx` calls `marketplaceReceiverOrThrow()` — never sends to `erd1…8354t` (empty). `listNft` embeds the same SC address in ESDTNFTTransfer data.

## Fee (product)

* Agents: `FEE_BPS=300` (3 %) · seller = price − fee · fee on SC until `claimFees`
* NFT market mainnet : **300 bps (3 %)** constatés le 11/11/2026 par `getFeeBps`, à relire avant toute signature ; total frais marketplace + royalties **≤ 1000 bps (10 %)**, sinon le smart contract rejette. Le montant affiché en fiche est une estimation, jamais une preuve de règlement.

## Click matrix (Market modal)

| Click    | TX data                   | Value      | Blocked if           |
| -------- | ------------------------- | ---------- | -------------------- |
| List     | ESDTNFTTransfer → listNft | 0          | !live / !sign        |
| Buy      | buyNft@listingId          | price EGLD | !live / !sign        |
| Bid      | placeBid@id               | bid EGLD   | !live / !sign        |
| Accept   | acceptBid@id              | 0          | !live / !sign        |
| Withdraw | withdrawBid@id            | 0          | !live / !sign        |
| Cancel   | cancelListing@id          | 0          | !live / !sign        |
| Offer    | —                         | —          | always (no endpoint) |

## Post-deploy

```bash
python scripts/verify_marketplace_codehash.py
python scripts/index_marketplace_listings.py   # → data/listings_index.json
# set VITE_* CODEHASH_OK=1 → rebuild Pages
```

## LIA vs user

Micro List/Buy = **user** wallet only. LIA ops = deploy / claimFees / burnify agent.
