#!/usr/bin/env bash
# LIA deploy helper — Hardhat example. No private keys in git.
set -euo pipefail

NETWORK="${NETWORK:-sepolia}"
ENV_FILE="${ENV_FILE:-.env}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== LIA deploy helper ($NETWORK) ===${NC}"

if [[ ! -d node_modules ]]; then
  echo -e "${BLUE}npm install...${NC}"
  npm install
fi

echo -e "${BLUE}hardhat compile...${NC}"
npx hardhat compile

echo -e "${BLUE}Deploy: npx hardhat run scripts/deploy_and_sync.ts --network $NETWORK${NC}"
echo "Expect log line: OUTPUT_ADDRESS:0x..."
echo "Then set NEXT_PUBLIC_CONTRACT_ADDRESS / VITE_ETH_TEST_TOKEN in env (public only)."
echo -e "${RED}Never put PRIVATE_KEY or RELAYER_PRIVATE_KEY in frontend env.${NC}"
