# Paybox (e-Transactions) — intégration xArtists

## Statut
- **Front branché** : choix Stripe / Paybox dans `PackCheckout` (`lib/payments.ts`, `lib/paybox.ts`).
- **Backend** : scaffold `services/access-api` — à compléter avec HMAC Paybox + clés marchand.

## Principe
Comme MoonPay / Stripe hosted : **aucune clé secrète en front**. Le navigateur ouvre une URL de paiement préparée et signée par le backend.

## Front
- `VITE_ACCESS_API_BASE` → `POST /v1/checkout/paybox`
- `VITE_PAYBOX_PAYMENT_URL` — fallback URL backend / redirect
- `startPayboxCardPayment({ packId, buyerAddress, amountEur })`

## Backend
1. Recevoir `pack_id`, `amount_cents`, `returnUrl`, `buyer_address` (erd1).
2. Signer les paramètres Paybox (HMAC / module officiel e-Transactions).
3. Répondre `{ "url": "https://preprod-tpeweb.paybox.com/...", "order_id": "…" }`.
4. IPN : valider signature → même pipeline mint que Stripe webhook.

## Return URLs front
- Succès : `/#/my-packs?paid=1`
- Annulation : `/#/my-packs?cancelled=1`

## Stripe (parcours 1) — rappel
- `POST /v1/checkout/session` ou `VITE_STRIPE_PAYMENT_LINK_{PULSE|YIELD|SENTINEL}`
- Voir `apps/frontend/src/lib/stripe.ts` + `services/access-api/README.md`
