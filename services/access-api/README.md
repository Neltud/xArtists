# Access API — Stripe + Paybox (packs xArtists)

Backend minimal pour les parcours **1 (Stripe)** et **3 (Paybox)**.
Secrets **uniquement ici**, jamais dans le front GitHub Pages.

## Endpoints

| Method | Path | Rôle |
|--------|------|------|
| `POST` | `/v1/checkout/session` | Node : 501 (Stripe SDK non intégré) ; Python : session Stripe si configuré |
| `POST` | `/v1/checkout/paybox` | 501 tant que signature HMAC et IPN vérifiée ne sont pas intégrées |
| `POST` | `/v1/checkout/paybox/ipn` | Non implémenté — ne jamais délivrer de NFT sur un retour navigateur |
| `GET`  | `/v1/checkout/status/:sessionId` | Python seulement : statut du reçu (non authentifié, à protéger) |

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
# optionnel : Stripe Payment Links seulement après preuve de liaison au wallet
VITE_STRIPE_PAYMENT_LINK_PULSE=...
# Paybox désactivé jusqu'au backend HMAC + IPN + mint
VITE_PAYBOX_ENABLED=false
```

## Flux

1. User choisit pack + Stripe ou Paybox dans `PackCheckout`.
2. Front `POST` session avec `pack_id`, `buyer_address` (erd1), **sans montant client**.
3. Le serveur choisit le prix et crée une session signée (non implémenté dans le serveur Node actuel).
4. Webhook / IPN **authentifié, idempotent et vérifié** → enregistre paiement → queue mint ; le minter live reste à implémenter.
5. Aucun paiement réel ne doit être activé avant tests d'intégration et preuve de livraison NFT.

Voir aussi `docs/PAYBOX_INTEGRATION.md`.
