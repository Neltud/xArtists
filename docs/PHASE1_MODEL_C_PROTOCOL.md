# Phase 1 — Product & Commercialization (Model C)

## Strategic lock

| Do | Don't |
|----|--------|
| Sell **Access Pass** (membership NFT) via Fiat | Manage user trading capital |
| Show **paper** LIA performance | Promise live yield on pack capital |
| Human **Pause/Resume** on hot wallet | Autonomous LIA without operator kill |
| Stripe webhook **signature verified** mint | Trust client “payment success” alone |

---

## Ultimate Safeguard (Human)

```bash
python -m lia.ops.operator_control status
python -m lia.ops.operator_control pause --reason "incident review"
python -m lia.ops.operator_control resume
```

State file: `data/operator_control.json`  
Executors must call `assert_execution_allowed()` before any signed TX.  
Env override: `LIA_OPERATOR_PAUSE=1`.

Guardian UI bar already reflects kill/trip from `lia_v6_status.json` (green/amber/red).

---

## Module 1 — Fiat → NFT

| Piece | Path |
|-------|------|
| Catalog prices | `services/access_pack/catalog.py` |
| Create session | `create_session.py` |
| Webhook + idempotency | `webhook_handler.py` |
| HTTP API | `api_app.py` (`ACCESS_API_PORT=8787`) |
| Front checkout + terms | `PackCheckout.tsx`, `AccessTermsModal.tsx` |

```bash
export STRIPE_SECRET_KEY=sk_test_…
export STRIPE_WEBHOOK_SECRET=whsec_…
export ACCESS_MINT_MODE=paper   # live only with PEM + collection
python services/access_pack/api_app.py
# Stripe CLI: stripe listen --forward-to localhost:8787/v1/webhooks/stripe
```

Front: `VITE_ACCESS_API_BASE=https://your-api`

### Async UX states

`idle → terms → redirect Stripe → polling status → minted | failed | cancelled`

---

## Module 2 — Paper dashboard

Route `/my-packs` — ledger from `simulated_ledger.json`, poll 60s, pack notional + ticket feed.  
Badge permanent: **PAPER · Model C**.

---

## Module 3 — Honest UI

- Terms modal mandatory before payment  
- GuardianStatusBar global (SAFE / WARNING / TRIPPED / KILLED)  
- Copy: access pass · simulated trades · no real funds for pack  

---

## Explicit non-goals (Phase 1)

- No deposit/withdraw trading funds to agents  
- No LIA_LIVE_TRADING=1 for pack capital  
- No “APY” on access packs  
