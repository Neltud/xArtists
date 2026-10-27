# Pack quote — Rule 1

Client prices: **110 / 75 / 50 €** (Pulse / Yield / Sentinel).  
Margin **4%** internal only. EGLD amount: **ceil 4 dp**. Tolerance **≤ 0.02 €**. TTL **12 min**.

Module: `services/access-api/src/quote.mjs`  
Tests: `services/access-api/tests/quote_rule1.test.mjs`

Endpoint (sandbox): `POST /v1/checkout/quote` `{ "pack_id", "rate_eur_per_egld" }`.

No production tariff change by display-only edits.
