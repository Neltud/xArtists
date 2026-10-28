# Runbook — Access-api sandbox + Pages (2026-10-28)

**Paper only.** No real card capture · no mint · `LIA_LIVE_TRADING=0`.

> **GO deploy checklist (Render Free + Neon):**  
> [`DEPLOY_RENDER_NEON_GO_2026-10-28.md`](./DEPLOY_RENDER_NEON_GO_2026-10-28.md)

## Goal

Unblock recette 1+2:

1. HTTPS access-api reachable  
2. `VITE_ACCESS_API_BASE` non-empty at Pages build  
3. Quote × 3 packs · guest 401 · SIWX · My Packs

## A. GitHub variable (Pages)

**Settings → Secrets and variables → Actions → Variables**

| Variable | Value |
|----------|--------|
| `VITE_ACCESS_API_BASE` | `https://<your-access-api>` (no trailing slash) |

Already wired in `.github/workflows/static.yml`.

After setting → **Actions → Deploy Vite app to GitHub Pages → Run workflow** (`main`).

## B. access-api runtime secrets (never in frontend)

| Secret | Required | Notes |
|--------|----------|-------|
| `ACCESS_JWT_SECRET` | **yes** | ≥ 16 chars, HS256 |
| `CORS_ORIGIN` | **yes** | `https://neltud.github.io` |
| `DATABASE_URL` | **yes** (sandbox) | Neon Free URI |
| `ACCESS_PUBLIC_BASE` | recommended | public origin |
| `PAYBOX_*` + `PAYBOX_IPN_URL` | card session | preprod; IPN **https://** |
| `LIA_LIVE_TRADING` | **0** | paper |

Without Paybox credentials → `POST /v1/checkout/paybox` stays **501** fail-closed.

## C. Deploy access-api (Render Free)

```
Root: services/access-api
Build: npm install --ignore-scripts
Start: npm start
Node: 20+
Health: GET /health  → orders_backend: postgres
```

## D. Smoke

```bash
API=https://<access-api>
curl -sS "$API/health"
curl -sS -X POST "$API/v1/checkout/quote" -H 'Content-Type: application/json' \
  -d '{"pack_id":"pulse","rate_eur_per_egld":12}'
curl -sS -w '%{http_code}\n' -X POST "$API/v1/checkout/paybox" \
  -H 'Content-Type: application/json' -d '{"pack_id":"pulse"}'
```

Expect quote Pulse: `amount_cents: 11000`. Guest paybox → **401**.

## E. UI after Pages rebuild

1. No “VITE_ACCESS_API_BASE missing — SAMPLE only”  
2. Guest checkout blocked  
3. xPortal + SIWX → Paybox session or 501 if secrets missing  
4. My Packs buyer-bound only  

## Out of scope

Live payments · mint · burn · Chronopost · dropship · `LIA_LIVE_TRADING=1`
