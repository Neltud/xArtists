---
hidden: false
---

# Security headers — GitHub Pages (P0)

**Date :** 2026-10-31  
**Contexte :** gap documenté dans `docs/PROD_LIVE_STATUS_SECURITY_2026-10-29.md`  
**Contrainte :** GitHub Pages ne permet pas de définir librement les response headers HTTP (sauf via reverse proxy / Cloudflare). On combine **meta CSP** + **headers documentés** + **config Pages future**.

## Cibles

| Header | Valeur cible |
|--------|----------------|
| Content-Security-Policy | meta dans `apps/frontend/index.html` — access-api, MultiversX, WalletConnect, MoonPay, Akash catalog |
| frame-ancestors | `'none'` |
| Referrer-Policy | `strict-origin-when-cross-origin` (meta name=referrer) |
| X-Content-Type-Options | `nosniff` (meta best-effort) |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), payment=(self)` |

> Ajuster `connect-src` si `VITE_ACCESS_API_BASE` ou Akash ingress change.

## Implémentation

1. **Meta CSP** dans `apps/frontend/index.html` — **fait** (2026-10-31).
2. Headers HTTP complets (XFO DENY, nosniff serveur) → Cloudflare / Netlify / Vercel quand edge dispo.
3. Musée WebGL = same-origin ; pas d’iframe tierce requise → `frame-ancestors 'none'` OK.

## Interdits

- `unsafe-inline` script permanent sans revue (réduire dès que possible).
- Ouverture `connect-src *`.
- Confiance navigateur `?paid=` pour confirmation paiement.

## Checklist

- [x] Meta CSP dans build frontend (`index.html`)
- [x] frame-ancestors none
- [x] Referrer-Policy + Permissions-Policy meta
- [x] connect-src : access-api + MultiversX + MoonPay + WC + Akash catalog
- [ ] Smoke post-deploy (Pages) : dApp charge, wallet connect, pas de mixed content
- [ ] Edge headers HTTP (Cloudflare) si domaine custom
