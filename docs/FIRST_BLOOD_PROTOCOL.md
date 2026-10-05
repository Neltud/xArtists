# First Blood Protocol — Hybrid signature (HITL)

## Coherence

| Layer | Owner |
|-------|--------|
| Intelligence / proposal | LIA |
| Signature | **You** (xPortal / Vellum / deployer) |
| Detection | `signature_bridge --match` |
| Capital gate | `LIA_LIVE_TRADING` (default **0**) |

Already proven dust (foundation):

1. TRO ESDT — `1b56321b…`
2. wrapEgld — `b843b2cc…`
3. WEGLD→USDC — `c45847d4…`

## Checklist next dust (optional)

1. Integration still green:
   ```bash
   PYTHONPATH=. python -m lia.genesis.integration_test
   ```
2. Fresh proposal:
   ```bash
   PYTHONPATH=. python -m lia.genesis.decision_chain --cycles 1
   PYTHONPATH=. python -m lia.guardian.signature_bridge --from-decision
   ```
3. Open `data/signature_packages.json` → copy **receiver / value / data / gasLimit**
4. Sign in xPortal (or Vellum executor) — **you** broadcast
5. Close loop:
   ```bash
   PYTHONPATH=. python -m lia.guardian.signature_bridge --match <txHash>
   ```
6. Keep `LIA_LIVE_TRADING=0` unless ops session explicitly opened

## Risks (honest)

- Auto-match takes **first waiting** package — one signature at a time
- Calldata must match package exactly or chain rejects / wrong intent
- Never set live=1 permanently on a shared host
