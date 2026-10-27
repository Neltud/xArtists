# Pack quote — Rule 1

Client prices: **110 / 75 / 50 €** (Pulse / Yield / Sentinel).

## Parity (corrected 2026-10-27)

```
amount_egld = ceil4( amount_eur / rate_eur_per_egld )
```

Margin **4%** is **accounting only** — it must **not** divide the crypto leg (`list/(1.04)` was a parity bug).

- Tolerance ≤ **0.02 €** after ceil  
- TTL **12 min**  
- Server sole authority for amounts  

Module: `services/access-api/src/quote.mjs`  
Tests: `services/access-api/tests/quote_rule1.test.mjs` (incl. parity)

Endpoint: `POST /v1/checkout/quote` `{ "pack_id", "rate_eur_per_egld" }`.
