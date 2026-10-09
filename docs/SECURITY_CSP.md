# Security — CSP & secrets

## Content-Security-Policy

| Emplacement | Rôle |
|-------------|------|
| `apps/frontend/index.html` meta CSP | Actif sur **GitHub Pages** |
| `apps/frontend/public/_headers` | Cloudflare / Netlify si déployé là |

### Autorisé (résumé)
- **connect-src** : MultiversX API · CoinGecko · Frankfurter · Reddit · rss2json · WalletConnect · GitHub raw
- **frame-src** : YouTube · SoundCloud · WalletConnect
- **script-src** : `'self'` + inline polyfill process + YT API (`unsafe-inline` / `unsafe-eval` requis par bundler + WC)

### Interdit volontairement
- `object-src 'none'`
- `frame-ancestors 'self'` (anti clickjack)
- Pas de `*` sur script-src

## News worker

`fetch_news.mjs` : `sanitizeText` / `sanitizeUrl` sur **tous** les champs avant écriture JSON.
- Strip HTML / balises script
- Bloque `javascript:` et handlers `on*=`
- URLs http(s) uniquement

## Secrets — ne jamais committer

| Secret | Où |
|--------|-----|
| `VITE_*_CODEHASH_OK` | GitHub Actions / Pages **secrets only** |
| Clés Stripe / webhook | serveur / Actions secrets |
| PEM / wallet deployer | hors repo |

Les variables `VITE_*` non secrètes (adresses publiques) peuvent être dans le build.  
**Ne jamais** mettre de clé privée, PEM, ou webhook signing secret dans `public/` ou le bundle client.

## Webhooks (fiat / checkout)

Validation HMAC / signature côté **serveur** uniquement (pas dans le front). Documenté dans `docs/CHECKOUT_FIAT_CRYPTO.md`.
