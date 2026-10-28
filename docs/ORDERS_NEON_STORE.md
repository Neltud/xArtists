# Orders store — file vs Neon (budget 0 €)

| Mode | When | Persistence |
|------|------|-------------|
| **file** | no `DATABASE_URL` | local JSON + wx lock |
| **postgres** | `DATABASE_URL` set | Neon Free · survives Render sleep |

## Render Free + Neon Free

Full checklist: [`DEPLOY_RENDER_NEON_GO_2026-10-28.md`](./DEPLOY_RENDER_NEON_GO_2026-10-28.md)

1. Neon project → `DATABASE_URL` (`sslmode=require`)
2. Render Web Service root: `services/access-api`
3. **Build:** `npm install --ignore-scripts`  
   (lean lock on repo — do **not** use bare `npm ci` without regenerating lock)
4. **Start:** `npm start`
5. Env: `DATABASE_URL`, `ACCESS_JWT_SECRET` (≥16), `CORS_ORIGIN=https://neltud.github.io`, `LIA_LIVE_TRADING=0`
6. Schema auto-created on first write (`ensureSchema`)
7. GitHub Variable `VITE_ACCESS_API_BASE` + rebuild Pages

`GET /health` → `orders_backend: "postgres" | "file"`

TLS: `rejectUnauthorized` on by default. `PGSSL=0` only for local non-TLS Postgres.

Paper only — mint remains simulated.
