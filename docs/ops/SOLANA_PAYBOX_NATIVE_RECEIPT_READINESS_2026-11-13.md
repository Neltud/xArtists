# SOL on Solana — receipt verification + PayBox.sh readiness (13 November 2026)

**Delivery: read-only candidate. NOT connected to PayBox.sh; no SOL received,
sent, signed, swapped, billed, bridged or deployed in this change.**

## Two distinct flows
- **PayBox.sh (crypto wallet / OAuth 2.1 / MCP):** requires the owner to grant
  access to a verified Solana credential in an authenticated PayBox session.
  A historical Solana address in `data/xorus_paybox_wallet_source.json` is
  explicitly *not* an approved deposit address. Never publish a deposit
  instruction before actual credential, network and address proof.
- **Paybox System / Verifone:** a **fiat card PSP**, not a SOL deposit rail.
  A verified fiat IPN is not a Solana transaction; it does not establish NFT
  delivery or on-chain rights.

## Safe step 1 — free devnet proof
- Use Solana **devnet** only. Two ephemeral wallets may be generated in
  `scripts/ops/solana_devnet_micro_transfer.mjs` and funded with a faucet.
  The keys must remain ephemeral and must not be reused on mainnet.
- Verify a native SOL transfer using a finalized `getTransaction` RPC record.
  `lia/xorus/solana_receipts.py` only accepts a one-instruction direct
  `SystemProgram.transfer` to the specified public recipient with a genuine
  source signer, exact positive balance delta, no inner instructions,
  and transaction signature match. Unknown programs and complex transfers
  are rejected.
- The result is always `settlement_recorded:false`,
  `paybox_control_verified:false`, `can_execute:false`. Never mark an order
  `paid`, `delivered`, or an owner wallet `linked` from this observation.

### Example: after a devnet faucet-funded transfer (public values only)
```python
from lia.xorus.solana_receipts import query_native_sol_receipt

observation = query_native_sol_receipt(
    signature="<FINALIZED_DEVNET_TRANSACTION_SIGNATURE>",
    recipient="<YOUR_EPHEMERAL_DEVNET_DESTINATION>",
    minimum_lamports=1000,
    network="devnet",
)
print(observation)
```

The placeholders must be replaced with your own public, validated devnet data.
This is a **read**, not a request to send funds. An observed transaction is
not proof of control of the target PayBox wallet.

## Safe step 2 — PayBox.sh connection (NOT completed)
1. Open [PayBox](https://paybox.sh/) on the owner's device. Connect via its
   official OAuth/MCP flow and authorize **read-only** wallet metadata first.
   The current workspace does not have the PayBox connector.
2. Confirm the current Solana wallet address and network *within the
   authenticated PayBox session*; never use historical candidate addresses
   directly. Establish wallet-control proof bound to a one-time challenge.
3. Only with exact-address proof and a separate voluntary on-device approval
   can the owner perform a **small native SOL mainnet transfer**, then compare
   finalized network receipts. No private keys, seeds, screenshots of
   credentials, or Solana mainnet faucet claims.
4. Configure a server-side, durable, idempotent receipt ledger with strict
   transaction/recipient uniqueness and a trusted authenticated owner account
   before linking this to balances, order fulfillment or customer deposits.
5. Monitor wallet/gas/rent, RPC reliability and transaction finality. A
   simulated/observed transfer does not authorize swaps or bridge operations.

## Smart-contract operations on Solana — separate capability
- Phase A: devnet read-only account inspections, program-ID allowlist and
  contract source/binary provenance. Test `simulateTransaction` on explicit
  unsigned instructions.
- Phase B: independent audit of authority, upgradeability, CPI, account
  ownership, PDA seeds, signer constraints, drains and freeze/pause paths.
- Phase C: disposable devnet deployment to a non-custodial **test owner wallet**
  with rollback and logs; explicit signatures required.
- Phase D: only after security and wallet approval: separate signed mainnet
  transaction with fixed program ID, exact amounts and recipient readback.
  No contract deployment, SPL mint, TRO bridge or trading is part of this PR.

Reference:
- https://solana.com/docs/rpc/http/gettransaction
- https://solana.com/docs/rpc/json-structures
- https://docs.paybox.sh/
- `docs/XORUS_PAYBOX_WALLET_LINK.md`
- `docs/MULTICHAIN_PAYBOX_EXECUTOR.md`
