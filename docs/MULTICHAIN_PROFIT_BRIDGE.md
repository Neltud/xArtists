# Multi-Chain Profit Bridge — Solana → MultiversX Treasury

**Status:** logic design / pre-mainnet — **no user funds**

## Workflow

1. DETECT realized PnL (Guardian + gates)
2. WITHDRAW REQUEST → `data/bridge_outbox.json`
3. SOURCE EXIT (Jupiter / Wormhole) — capped
4. DESTINATION: `treasury-splitter.receiveAndSplit`
5. SPLIT 40/30/30
6. PROOF receipt + optional micro_proof

## Caps

- BRIDGE_MAX_PER_TX_USDC (default 500)
- BRIDGE_MAX_PER_DAY_USDC (default 2000)
- BRIDGE_MIN_PROFIT_USDC (default 50)
- Requires LIA_LIVE_TRADING=1 and LIA_BRIDGE_LIVE=1 for live mode

Cross-chain is not atomic; use pull model after destination confirmation, unique bridge ids, no user deposits.

Implementation: `lia/bridge/profit_remit.py`
