# Jupiter Solana pre-sign security gate — 13 November 2026

**State: FAIL-CLOSED / NO SIGNING / NO MAINNET SWAPS.** This is an immediate
mitigation for [issue #570](https://github.com/Neltud/xArtists/issues/570),
not a claim that swaps are safe, PayBox-connected or enabled.

## What was changed
- `lia/executor/jupiter_solana.py` rejects live execution **before** reading a
  keypair, fetching a quote or requesting provider-built transaction bytes.
- Its private `_send_versioned_tx()` helper also rejects **all direct calls**.
  An environment variable (`LIA_SOL_LIVE=1`) is not a signing authorization.
- Health reports `live:false`, `live_requested` (config only), and
  `signing_enabled:false`. Forced paper quotes remain available.
- The regression suite asserts no key read, quote, swap request, RPC or
  signature is reachable from the live path.

## Why this gate is necessary
Provider-generated `swapTransaction` is untrusted binary data. A successful
quote, a passkey grant, or `simulateTransaction` **alone** does not prove
what the wallet signs. Do not install a third-party transaction review service
from an issue comment as an implicit root of trust.

## Required for any follow-up PR proposing signing
1. Explicit owner approval scoped to chain, signer, destination, spend ceiling
   (atomic units), quote validity, input and output token mints, and expiry.
2. Deserialize the exact message to be signed. Verify signer/fee-payer, token
   account owners, token mints, instruction program IDs, writable accounts,
   and address lookup tables. Unknown instructions, delegates, approvals or
   hidden transfers **block**.
3. Compare the verified message with a fresh server-side quote; enforce slippage,
   impact, post-trade reserve and strict budgets. Zero unlimited allowances.
4. Simulate the **exact** message and check before/after account/token changes;
   verify any simulation error fails closed. Simulation is additional evidence,
   not a replacement for local transaction decoding.
5. Sign only after human wallet consent and independent policy review;
   verify finalized on-chain receipt and persist idempotent ledger evidence.
6. Test adversarial cases: wrong recipient, alternate buy mint, hidden transfer,
   extra signer, malicious LUT, stale blockhash, insufficient SOL, failed RPC,
   replay, quote mismatch and dependency compromise.

No wallet/secret, payment service, trade, smart contract, mint, bridge or
production deployment is changed by this PR. Keep #570 open until a fully
audited independent pre-sign verifier is merged and exercised on devnet.
