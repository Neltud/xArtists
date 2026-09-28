# Secrets — mainnet prep (jamais dans le front source)

## GitHub Actions / Pages build

| Secret | Usage |
|--------|--------|
| `VITE_PULSE_API` | URL HTTPS pulse-api (Akash/Docker) |
| `VITE_VELLUM_8008_WEBHOOK` | Proxy only → Vellum execute-workflow (pas la clé Vellum) |
| `SC_DEPLOYER_PEM` | Deploy SC uniquement · jamais `VITE_*` |
| `VITE_*_CODEHASH_OK` | `true` seulement après verify codeHash |

## Règles

1. PEM hors git, hors chat, hors Akash, hors localStorage.
2. Webhook Vellum = **proxy** (Worker/Cloudflare) qui détient la clé API Vellum.
3. Pages: variables `VITE_*` injectées au **build** Actions, pas au runtime navigateur secrets.
4. SC flags OFF jusqu’à checklist GO_LIVE verte.

## Local

```bash
# .env.local (gitignore)
VITE_PULSE_API=http://localhost:8090
# VITE_VELLUM_8008_WEBHOOK=https://your-proxy.example/vellum-8008
```
