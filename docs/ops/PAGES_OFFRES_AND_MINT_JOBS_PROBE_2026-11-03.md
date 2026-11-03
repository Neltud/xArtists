# Pages /offres + mint_jobs probe — 2026-11-03

## Contact / DNS (#341)

| Check | Result |
|-------|--------|
| `xartists.art` A/MX/NS (dns.google) | **NXDOMAIN** |
| `hello@xartists.art` | **not deliverable** until DNS+mailbox proven |
| `/offres` hard path on Pages | **HTTP 404** |
| `/#/offres` | **200** (SPA hash) |
| Checkout / mint live | still **off** on `/health` |

`apps/frontend/public/404.html` already rewrites `pathname` → `/xArtists/#/...`. If hard `/offres` 404s in production, the **deployed Pages artifact is missing that 404.html at site root** or GH Pages project settings do not serve it for unknown paths. Fix: ensure CI copies `404.html` next to `index.html` on the Pages branch/dist.

Until then, public links should use **`https://neltud.github.io/xArtists/#/offres`** (or the Render SPA equivalent with hash).

## mint_jobs (#281)

```
GET /v1/ops/orders-store/status → ok, table_ready true
GET /v1/ops/mint-jobs-store/status → 503 { ok:false, backend:postgres, table_ready:false }
```

Operator on **Render-bound** DB only:

```sql
SELECT to_regclass('public.mint_jobs');
-- if null: apply services/access-api/sql/mint_jobs.sql
```

Do not enable checkout or live mint.
