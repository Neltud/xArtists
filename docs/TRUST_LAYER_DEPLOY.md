# Trust Layer — Deploy Protocol (Verify → Deploy → Release)

**Mainnet only (CHAIN=1). Fail-closed. No performance promises.**

## 1. Treasury Splitter

| Destination | bps | % |
|-------------|-----|---|
| Mission_Fund | 4000 | 40 |
| Reserve_Fund | 3000 | 30 |
| Reward_Pool | 2000 | 20 |
| Operational_Ops | 1000 | 10 |

Source: `contracts/treasury-splitter/src/lib.rs`

```bash
export CHAIN=1 PEM=/secure/mainnet.pem
export MISSION_ADDR=erd1... RESERVE_ADDR=erd1... REWARD_ADDR=erd1... OPS_ADDR=erd1...
./scripts/deploy_treasury_splitter.sh
python scripts/post_deploy_contracts.py --treasury-splitter erd1...
python scripts/codehash_protocol.py --contract treasury-splitter
```

Log: `data/deploy_treasury_splitter_last.json` (address + wasm_sha256).

## 2. Multisig parameter change

Proposal → Time-lock (48h bps / 7d ownership) → M-of-N signatures → Execution  
`setSplitBps` / `setDestinations` / `setPaused` / 2-step `transferOwnership`+`acceptOwnership`

## 3. CodeHash protocol (market + agents)

```bash
./scripts/build_scs_isolated.sh nft-marketplace
./scripts/build_scs_isolated.sh agents-marketplace
python scripts/codehash_protocol.py --all-local
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace
python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...
python scripts/verify_marketplace_codehash.py
```

Never remove FE banners until codeHash ≠ null.

## 4. Kill-switch manual reset

```bash
PYTHONPATH=. python -m lia.guardian.manual_reset_cli status
PYTHONPATH=. python -m lia.guardian.manual_reset_cli request --operator ops --note 'incident'
KILL_RESET_ACK=1 PYTHONPATH=. python -m lia.guardian.manual_reset_cli confirm \
  --operator multisig --post-mortem https://...
```

Never auto-reset from Vellum Timer.
