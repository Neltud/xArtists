# Marketplace buy — status

## Proven successful buy (user)

| Field | Value |
|-------|--------|
| TX | `57b7b5e2e9102b7a715c9e08a602afd070b1861098b7d4baf4ab5edab801806e` |
| Function | `buyNft@01` |
| Value | 0.25 EGLD |
| Buyer | `erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l` |
| Status | **success** |
| Explorer | https://explorer.multiversx.com/transactions/57b7b5e2e9102b7a715c9e08a602afd070b1861098b7d4baf4ab5edab801806e |

## Re-list after buy

Listing TX `500c2b1f160c009e…` put `ASFT-a6273a-01` back on the market SC. Inventory may show 1 SFT on SC again.

## Deployer buy attempt (blocked)

| Field | Value |
|-------|--------|
| TX | `b44f9e9104e8089241edd9fd3425b9e3768d98b8e0c4658dad5c37020f2d4a21` |
| Error | `sending value to non payable contract` |
| Account flag | `isPayable: false` on market SC |

Source (`contracts/nft-marketplace`) has `#[payable("EGLD")]` on `buyNft`. Account-level **CodeMetadata payable** is false — **upgrade** with payable metadata required for EGLD buys to work again for all wallets.

## Upgrade checklist (owner = deployer)

1. Build wasm: `contracts/nft-marketplace`
2. Upgrade same address with CodeMetadata: **payable + payableBySc** (and upgradeable as today)
3. Verify `isPayable: true` on explorer account
4. Micro-buy dust or full 0.25 listing

## Frontend

- `buyNft@{even_hex(listingId)}` + value = price
- Listing id 1 → `buyNft@01`
