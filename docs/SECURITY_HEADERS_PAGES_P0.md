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
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://xartists-access-api.onrender.com https://*.multiversx.com https://api.multiversx.com https://devnet-api.multiversx.com https://*.moonpay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https:` |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |

> Ajuster `connect-src` si `VITE_ACCESS_API_BASE` ou Akash ingress change.

## Implémentation progressive

1. **Meta CSP** dans `index.html` (Pages compatible immédiat).
2. Documenter les headers HTTP pour déploiement derrière Cloudflare / Netlify / Vercel.
3. Vérifier absence de `frame-ancestors` conflictuel avec embeds légitimes (musée WebGL = même origine).

## Interdits

- `unsafe-inline` script permanent sans revue (réduire dès que possible).
- Ouverture `connect-src *`.
- Confiance navigateur `?paid=` pour confirmation paiement.

## Checklist

- [ ] Meta CSP dans build frontend
- [ ] frame-ancestors none / XFO DENY
- [ ] nosniff + Referrer-Policy documentés
- [ ] connect-src limité à API + MultiversX + MoonPay
- [ ] Smoke post-deploy (Pages) : dApp charge, wallet connect, pas de mixed content
