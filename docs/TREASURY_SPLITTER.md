# Treasury Splitter — design & integration

**Contract:** `contracts/treasury-splitter`  
**Default split:** Mission 40% · Reserve 30% · Community 30% (bps 4000/3000/3000)

## State machine

```
[Idle]
   │  payable receiveAndSplit(EGLD)
   ▼
[Accounting]  total_split += amount
   │
   ├─► direct_egld Mission   (amount * mission_bps / 10000)
   ├─► direct_egld Community (amount * community_bps / 10000)
   └─► direct_egld Reserve   (remainder — absorbs dust)

[Paused] ──setPaused(false)──► [Idle]
Owner-only: setSplitBps (sum=10000), setDestinations, transferOwnership 2-step
```

## Integration (v1)

1. After marketplace `claimFees` → send EGLD to splitter `receiveAndSplit`.
2. LIA PnL live only if `LIA_LIVE_TRADING=1` + micro-proof.
3. Ops gas stays on LIA Ops (not through splitter).

## Deploy prerequisites

Create Mission + Reserve wallets first, then:

```bash
mxpy contract deploy --bytecode output/treasury-splitter.wasm \
  --arguments <mission> <reserve> <community> 4000 3000 3000 \
  --pem multisig-or-lia.pem --gas-limit 60000000 --send
```

Register in `data/contracts.json`. Owner should be multisig in production.
