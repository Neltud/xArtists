# Marketplace — upgrade payable (ops)

## Problem

Account `nft_marketplace` reports:

```text
isPayable: false
isPayableBySmartContract: false
codeHash: 8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc=
```

Source has `#[payable("EGLD")]` on `buyNft`. Account CodeMetadata was deployed without the payable bit → new EGLD buys fail with:

`sending value to non payable contract`

## Proven buy (before flag drift / re-list)

https://explorer.multiversx.com/transactions/57b7b5e2e9102b7a715c9e08a602afd070b1861098b7d4baf4ab5edab801806e

## Fix (owner = deployer)

```bash
cd contracts/nft-marketplace
# Build wasm with sc-meta / mxpy (same toolchain as original deploy)
mxpy contract build .
# or: cargo run -p nft-marketplace-meta

# Upgrade SAME address with CodeMetadata:
#   upgradeable + readable + payable + payableBySmartContract
mxpy contract upgrade erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm \
  --bytecode output/nft-marketplace.wasm \
  --metadata-payable \
  --metadata-payable-by-sc \
  --metadata-upgradeable \
  --proxy https://gateway.multiversx.com \
  --pem /path/to/deployer.pem \
  --send
```

Verify:

```bash
curl -s https://api.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm \
  | jq '{isPayable,isPayableBySmartContract,codeHash}'
```

Expect `isPayable: true`. Then micro-buy `buyNft@01` with listing price.

## Do not

- Change SC address in front without updating secrets + contracts.json
- Commit PEM
