#!/usr/bin/env bash
# Deploy helper EXAMPLE — Hardhat Sepolia. Never commit private keys.
set -euo pipefail
NETWORK="${NETWORK:-sepolia}"
ENV_FILE="${ENV_FILE:-.env}"

echo "=== LIA deploy helper ($NETWORK) ==="
if [[ ! -d node_modules ]]; then
  npm install
fi
npx hardhat compile
echo "Run: npx hardhat run scripts/deploy_and_sync.ts --network $NETWORK"
echo "Capture OUTPUT_ADDRESS:0x... then set VITE_/NEXT_PUBLIC_CONTRACT_ADDRESS"
echo "RELAYER_PRIVATE_KEY and OPENAI_API_KEY must stay server-only."
