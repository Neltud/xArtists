# RWA Escrow — state machine

**Contract:** `contracts/rwa-escrow-bridge`  
**Statuses:** 0 Open · 1 Released · 2 Refunded · 3 Cancelled · 4 Disputed

```
                    openEscrow(EGLD)
                          │
                          ▼
                       [OPEN]
              ┌───────────┼───────────────┬────────────────┐
              │           │               │                │
     confirmReceipt  submitVerification  openDispute   refund
        (payer)      Proof (attestor)   (payer|seller)  (deadline/owner)
              │           │               │                │
              ▼           ▼               ▼                ▼
         [RELEASED]  [RELEASED]      [DISPUTED]       [REFUNDED]
         → seller     → seller            │
                                          │ resolveDispute(owner)
                              ┌───────────┴──────────┐
                              ▼                      ▼
                         [RELEASED]             [REFUNDED]
```

Dispute cooling: 7 days. Only owner resolves (multisig recommended).
Attestor posts NFC/AR proof hash → release to seller.
CEI on all money paths. Experimental until codeHash live.
