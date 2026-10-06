# Sprint 1.1 — Zero-trust verify-access

## Shipped

- `services/access-api/src/verifyAccess.mjs` — MVX NFT read + HS256 JWT
- `POST /v1/verify-access` · `GET /v1/access/introspect`
- `tcaVerifyClient.ts` + `TcaGatePage` — FULL only from server
- Demo localStorage packs disabled when `import.meta.env.PROD`

## Server env (never git)

```bash
JWT_SECRET=min_16_chars_random
PULSE_COLLECTION=PULSE-xxxxxx
PULSE_ALLOWLIST=erd1...,erd1...
MVX_API_URL=https://api.multiversx.com
CORS_ORIGIN=https://neltud.github.io
PORT=8787
```

## Front build

```bash
VITE_ACCESS_API_BASE=https://your-access-api.example.com
# dev only:
VITE_ALLOW_TCA_DEMO_PACKS=true
```

## Fail closed

| Case | Result |
|------|--------|
| No API base | SAMPLE |
| API down | SAMPLE |
| FULL without JWT_SECRET | 503 then SAMPLE |
| No wallet | NONE |

## Local test

```bash
export JWT_SECRET=dev_secret_16chars
export PULSE_ALLOWLIST=erd1yourwallet...
node services/access-api/src/server.mjs
curl -s -X POST http://127.0.0.1:8787/v1/verify-access \
  -H 'Content-Type: application/json' \
  -d '{"address":"erd1yourwallet..."}'
```

Air-gap: read-only. No mint from this path.
