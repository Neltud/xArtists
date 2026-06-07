#!/bin/bash

# ================================================
# xArtists - Deploy Staking Contracts with LIA Wallet
# ================================================

set -e

LIA_WALLET_PEM="ton-wallet-lia.pem"   # <-- Change this to your actual .pem file name
LIA_ADDRESS="erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"

echo "===================================="
echo " Deploying contracts with LIA wallet"
echo " LIA Address: $LIA_ADDRESS"
echo "===================================="

# Check if pem file exists
if [ ! -f "$LIA_WALLET_PEM" ]; then
  echo "Error: PEM file '$LIA_WALLET_PEM' not found!"
  echo "Please place your LIA wallet .pem file in the root directory."
  exit 1
fi

# Function to deploy a contract
deploy_contract() {
  local CONTRACT_NAME=$1
  local WASM_PATH=$2
  local OUTPUT_FILE=$3

  echo ""
  echo "--- Deploying $CONTRACT_NAME ---"

  if [ ! -f "$WASM_PATH" ]; then
    echo "Error: WASM file not found at $WASM_PATH"
    echo "Please build the contract first."
    exit 1
  fi

  mxpy contract deploy \
    --bytecode "$WASM_PATH" \
    --pem "$LIA_WALLET_PEM" \
    --gas-limit 200000000 \
    --outfile "$OUTPUT_FILE"

  echo "Deployment of $CONTRACT_NAME completed."
  echo "Address saved in: $OUTPUT_FILE"
}

# Build contracts (optional but recommended)
echo ""
echo "Building contracts..."

cd contracts/tro-staking
cargo build --release --target wasm32-unknown-unknown
cd ../..

cd contracts/nft-staking
cargo build --release --target wasm32-unknown-unknown
cd ../..

# Deploy tro-staking
deploy_contract "tro-staking" \
  "contracts/tro-staking/output/tro_staking.wasm" \
  "tro-staking-address.json"

# Deploy nft-staking
deploy_contract "nft-staking" \
  "contracts/nft-staking/output/nft_staking.wasm" \
  "nft-staking-address.json"

 echo ""
echo "===================================="
echo " Deployment finished!"
echo ""
echo "Next steps:"
echo "1. Open tro-staking-address.json and nft-staking-address.json"
echo "2. Copy the contract addresses"
echo "3. Update them in .env and src/services/transactions.ts"
echo "===================================="
