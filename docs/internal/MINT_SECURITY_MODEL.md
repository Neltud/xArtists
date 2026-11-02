# Internal — Mint security model (Sprint 2 review)

## Review fixes applied

| Risk | Mitigation |
|------|------------|
| Multi-instance file lock | `DATABASE_URL` → Postgres `mint_jobs` + `pg_advisory_xact_lock` |
| `status=paid` legacy | **Removed** — only `server_confirmed` or `payment_verified` |
| NFT most-recent | Snapshot pre-buy identifiers; transfer **exactly one new** |
| Restore soft-fail | **exit 1** if restore fails; post-query `getPackPrice` must match Rule1 |
| Price non-atomic | Residual: concurrency group per pack; no micro path in long-term GO |

## Payment proof

`assertPaymentAllowsMint` requires:

- `server_confirmed === true` **OR** `payment_verified === true`
- `provider_tx_id` present
- amount/currency/pack/buyer/order_id valid
- not refunded/cancelled/refused

IPN handler must set the flag only after RSA verification.

## Idempotency stores

- **Postgres** (production multi-replica): table `mint_jobs`
- **File** (local/single): `MINT_JOBS_PATH` + wx lock — **not** multi-instance safe

## Residual

Micro `setPackPrice` window remains non-atomic vs external buyers. Prefer funded Rule1 path when liquid.
