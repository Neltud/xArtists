# GO Deploy — Render Free + Neon Free (2026-10-28)

**Budget 0 € · paper only · no real payments · no mint · LIA_LIVE_TRADING=0**

PR #200 is on `main` (`3fd28500`). Orders dual-store ready.

---

## 1. Neon (already created)

| | |
|--|--|
| Project | `xartists-access-sandbox` |
| Region | Frankfurt |
| Branch | `sandbox` / db `xartists_access` |

**Copy** connection string (Dashboard → Connection details → URI):

```
postgresql://…@…eu-central-1.aws.neon.tech/xartists_access?sslmode=require
```

Do **not** commit this string.

---

## 2. Render Free — Web Service

1. [render.com](https://render.com) → **New → Web Service**
2. Connect GitHub `Neltud/xArtists`
3. Settings:

| Field | Value |
|-------|--------|
| Name | `xartists-access-api` |
| Region | Frankfurt (or closest) |
| Branch | `main` |
| Root Directory | `services/access-api` |
| Runtime | Node |
| Build Command | `npm install --ignore-scripts` |
| Start Command | `npm start` |
| Instance | **Free** |

4. **Environment** (Environment → Environment Variables):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Neon URI (above) |
| `ACCESS_JWT_SECRET` | random ≥16 chars |
| `CORS_ORIGIN` | `https://neltud.github.io` |
| `ACCESS_PUBLIC_BASE` | `https://neltud.github.io` |
| `LIA_LIVE_TRADING` | `0` |
| `NODE_VERSION` | `20` |

Optional later: `PAYBOX_*`, `PAYBOX_IPN_URL=https://xartists-access-api.onrender.com/v1/checkout/paybox/ipn`

5. **Create Web Service** → wait for deploy (~2–5 min first time).

Cold start Free ≈ **60 s** after 15 min idle.

---

## 3. Smoke

```bash
API=https://xartists-access-api.onrender.com   # or your Render URL

curl -sS "$API/health" | jq .
# expect: ok:true, orders_backend:"postgres", lia_live_trading:"0"

curl -sS -X POST "$API/v1/checkout/quote" \
  -H 'Content-Type: application/json' \
  -d '{"pack_id":"pulse","rate_eur_per_egld":12}' | jq .
# amount_cents: 11000

curl -sS -o /dev/null -w '%{http_code}\n' -X POST "$API/v1/checkout/paybox" \
  -H 'Content-Type: application/json' \
  -d '{"pack_id":"pulse"}'
# 401 without JWT/SIWX
```

---

## 4. GitHub Pages bridge

**Repo → Settings → Secrets and variables → Actions → Variables**

| Variable | Value |
|----------|--------|
| `VITE_ACCESS_API_BASE` | `https://xartists-access-api.onrender.com` (no trailing `/`) |

Then: **Actions → Deploy Vite app to GitHub Pages → Run workflow** on `main`.

---

## 5. Recette UI

1. Open `https://neltud.github.io/xArtists/`
2. No banner “VITE_ACCESS_API_BASE missing”
3. Guest checkout → blocked
4. Wallet + SIWX → session or **501** if Paybox secrets still missing (fail-closed OK)
5. My Packs = server data only

---

## Fail-closed (expected)

| Condition | Result |
|-----------|--------|
| No `ACCESS_JWT_SECRET` | JWT paths fail |
| No Paybox merchant secrets | `POST /v1/checkout/paybox` → 501 |
| No `DATABASE_URL` | `orders_backend: file` (ephemeral on Render) |
| Simulated mint | never grants production rights |

---

## Out of scope (still)

Real card capture · on-chain mint · burn · `LIA_LIVE_TRADING=1` · dropship
