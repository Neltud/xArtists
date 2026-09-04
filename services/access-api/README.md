# Access API — Stripe + Paybox (packs xArtists)

Backend minimal pour les parcours **1 (Stripe)** et **3 (Paybox)**.
Secrets **uniquement ici**, jamais dans le front GitHub Pages.

## Endpoints

| Method | Path | Rôle |
|--------|------|------|
| `POST` | `/v1/checkout/session` | Crée une Stripe Checkout Session → `{ url }` |
| `POST` | `/v1/checkout/paybox` | Prépare / signe Paybox → `{ url, order_id }` |
| `POST` | `/v1/checkout/paybox/ipn` | IPN Paybox (signature) → mint / mark paid |
| `GET`  | `/v1/checkout/status/:sessionId` | Statut mint (My Packs poll) |

## Env serveur

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYBOX_SITE=...
PAYBOX_RANG=...
PAYBOX_HMAC_KEY=...
PAYBOX_ENV=preprod   # or prod
CORS_ORIGIN=https://neltud.github.io
```

## Front (GitHub Pages build secrets / env)

```bash
VITE_ACCESS_API_BASE=https://access-api.example.com
# optionnel si pas d’API encore :
VITE_STRIPE_PAYMENT_LINK_PULSE=...
VITE_PAYBOX_PAYMENT_URL=https://access-api.example.com/v1/checkout/paybox/redirect
```

## Flux

1. User choisit pack + Stripe ou Paybox dans `PackCheckout`.
2. Front `POST` session avec `pack_id`, `buyer_address` (erd1), montant.
3. Redirect TPE / Checkout.
4. Webhook / IPN → enregistre paiement → mint NFT pack (quand SC live) ou flag paper paid.

Voir aussi `docs/PAYBOX_INTEGRATION.md`.
