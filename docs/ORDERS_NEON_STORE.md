# Orders store — file vs Neon (budget 0 €)

| Mode | When | Persistence |
|------|------|-------------|
| **file** | no `DATABASE_URL` | local JSON + wx lock |
| **postgres** | `DATABASE_URL` set | Neon Free · survives Render sleep |

## Render Free + Neon Free

1. Neon project → copy `DATABASE_URL`  
2. Render Web Service root `services/access-api`  
3. Build: `npm install --include=optional` (installs `pg`)  
4. Start: `npm start`  
5. Env:
   - `DATABASE_URL=postgresql://…`
   - `ACCESS_JWT_SECRET` (≥16)
   - `CORS_ORIGIN=https://neltud.github.io`
   - `LIA_LIVE_TRADING=0`
6. Schema auto-created on first write (`ensureSchema`)  
7. GitHub variable `VITE_ACCESS_API_BASE=https://…onrender.com`  
8. Rebuild Pages

`GET /health` → `orders_backend: "postgres" | "file"`.

`pg` is **optionalDependency** so CI `npm ci` stays green without Postgres. Render must install optionals.

Paper only — mint simulated.
