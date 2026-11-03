# Pack refunds & payment integrity

## Principles

1. **Paid ≠ NFT delivered.** Order may be `paid` / `server_confirmed` while `delivery` is still `simulated` or `awaiting_dispatch`.
2. **IPN RSA only.** No unsigned status flips.
3. **Amount must match** catalogue cents locked at `createOrder`.
4. **provider_tx_id** unique across orders; conflict → reject.
5. **Cancelled/refused cannot be revived** by a later success IPN.
6. **Refunded** orders must never become mint-eligible (`assertPaymentAllowsMint` blocks invalidating statuses).

## Operator refund ladder

| Stage | Action |
|-------|--------|
| A — Checkout never completed | No charge · no order paid · nothing to refund |
| B — Paid, no mint job / dry-run only | Refund via PayBox merchant backoffice · mark order `refunded` in ops notes · do **not** dispatch live mint |
| C — Paid + dry-run workflow only | Same as B · no chain asset moved |
| D — Paid + live NFT already with buyer | **Not supported automatically** · case-by-case (buy-back / off-platform) until policy + tooling exist |

Today production is **B/C only** capable: live mint denied (#310), checkout typically off.

## Engineering checks (tests already encode)

- amount_mismatch reject
- provider_tx reuse reject
- paid + late failure IPN does not un-pay
- cancelled not revived
- mint gate requires `server_confirmed` \| `payment_verified` + provider_tx_id

## Customer-facing text

> If you were charged and did not receive access or an NFT confirmation within the stated window, contact support with your order id. Card refunds are processed by the payment provider; blockchain transfers, when enabled, are final.

## Never

- Auto-refund script with merchant PEM in repo
- “Refund” that mints a replacement without payment verification
- Deleting `mint_jobs` claims to force retry after uncertain GitHub 204
