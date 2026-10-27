# Orders store — file vs Neon (budget 0 €)

| Mode | When | Persistence |
|------|------|-------------|
| **file** | no `DATABASE_URL` | local JSON + wx lock |
| **postgres** | `DATABASE_URL` set | Neon Free · survives Render sleep |

## Render Free + Neon Free

1. Neon project → copy connection string  
2. Render Web Service `services/access-api`  
3. Env:
   - `DATABASE_URL=postgresql://…`
   - `ACCESS_JWT_SECRET` (≥16)
   - `CORS_ORIGIN=https://neltud.github.io`
   - `LIA_LIVE_TRADING=0`
4. Schema auto-created on first write (`ensureSchema`) or run `sql/001_paybox_orders.sql`  
5. GitHub variable `VITE_ACCESS_API_BASE=https://…onrender.com`  
6. Rebuild Pages

`GET /health` exposes `orders_backend: "postgres" | "file"`.

Paper only — mint remains simulated.
