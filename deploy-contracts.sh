#!/bin/bash

# ================================================
# xArtists - Deploy Staking Contracts with LIA Wallet
# ================================================

set -e

LIA_WALLET_PEM="ton-wallet-lia.pem"
LIA_ADDRESS="erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"

ENV_FILE=".env"

update_env() {
  local KEY=$1
  local VALUE=$2

  if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
  fi

  # Remove existing line if present
  grep -v "^${KEY}=" "$ENV_FILE" > "${ENV_FILE}.tmp" || true
  echo "${KEY}=${VALUE}" >> "${ENV_FILE}.tmp"
  mv "${ENV_FILE}.tmp" "$ENV_FILE"

  echo "Updated $KEY in .env"
}

echo "===================================="
echo " Deploying contracts with LIA wallet"
echo " LIA Address: $LIA_ADDRESS"
echo "===================================="

if [ ! -f "$LIA_WALLET_PEM" ]; then
  echo "Error: PEM file '$LIA_WALLET_PEM' not found!"
  exit 1
fi

# Build contracts
echo ""
echo "Building contracts..."

(cd contracts/tro-staking && cargo build --release --target wasm32-unknown-unknown)
(cd contracts/nft-staking && cargo build --release --target wasm32-unknown-unknown)

deploy_contract() {
  local CONTRACT_NAME=$1
  local WASM_PATH=$2
  local OUTPUT_FILE=$3
  local ENV_KEY=$4

  echo ""
  echo "--- Deploying $CONTRACT_NAME ---"

  if [ ! -f "$WASM_PATH" ]; then
    echo "Error: WASM not found at $WASM_PATH"
    exit 1
  fi

  mxpy contract deploy \
    --bytecode "$WASM_PATH" \
    --pem "$LIA_WALLET_PEM" \
    --gas-limit 200000000 \
    --outfile "$OUTPUT_FILE"

  # Extract address from JSON
  if command -v jq &> /dev/null; then
    ADDRESS=$(jq -r '.contractAddress' "$OUTPUT_FILE")
  else
    ADDRESS=$(grep -o '"contractAddress":"[^"]*"' "$OUTPUT_FILE" | cut -d'"' -f4)
  fi

  if [ -z "$ADDRESS" ]; then
    echo "Failed to extract contract address from $OUTPUT_FILE"
    exit 1
  fi

  echo "Deployed $CONTRACT_NAME at: $ADDRESS"

  # Update .env
  update_env "$ENV_KEY" "$ADDRESS"
}

# Deploy contracts
deploy_contract "tro-staking" \
  "contracts/tro-staking/output/tro_staking.wasm" \
  "tro-staking-address.json" \
  "VITE_TRO_STAKING_ADDRESS"

deploy_contract "nft-staking" \
  "contracts/nft-staking/output/nft_staking.wasm" \
  "nft-staking-address.json" \
  "VITE_NFT_STAKING_ADDRESS"

 echo ""
echo "===================================="
echo " Deployment finished successfully!"
echo ""
echo ".env has been updated with contract addresses."
echo "You can now commit the changes or use them locally."
echo "===================================="
