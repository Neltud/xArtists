# Orders store — file vs Neon (budget 0 €)

| Mode | When | Persistence |
|------|------|-------------|
| **file** | no `DATABASE_URL` | local JSON + wx lock |
| **postgres** | `DATABASE_URL` set | Neon Free · survives Render sleep |

## Render Free + Neon Free

1. Neon project → `DATABASE_URL`  
2. Render Web Service root: `services/access-api`  
3. **Build command:** `npm install --ignore-scripts && npm install pg@8.13.1 --ignore-scripts`  
4. **Start:** `npm start`  
5. Env: `DATABASE_URL`, `ACCESS_JWT_SECRET`, `CORS_ORIGIN=https://neltud.github.io`, `LIA_LIVE_TRADING=0`  
6. Schema auto-created on first write  
7. GitHub var `VITE_ACCESS_API_BASE` + rebuild Pages  

`pg` is **not** in package.json deps (keeps CI `npm ci` green). Install on Render only.

`GET /health` → `orders_backend: postgres|file`

Paper only.
