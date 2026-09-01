# Paybox (e-Transactions) — intégration xArtists

## Principe
Comme MoonPay : **aucune clé secrète en front**. Le navigateur ouvre une URL de paiement préparée et signée par le backend.

## Front
- `VITE_PAYBOX_PAYMENT_URL` — URL de base du endpoint backend
- `apps/frontend/src/lib/paybox.ts` → `openPayboxCheckout({ orderId, amountCents, returnUrl })`

## Backend (à brancher)
1. Recevoir `orderId`, `amount` (centimes EUR), `returnUrl`, `buyer_address` (erd1).
2. Signer les paramètres Paybox (HMAC / module officiel e-Transactions).
3. Répondre `{ "url": "https://preprod-tpeweb.paybox.com/..." }` ou rediriger 302.
4. IPN / webhook : valider signature, puis déclencher mint pack (pipeline Stripe).

## Return URLs front
- Succès : `/#/my-packs?paid=1`
- Annulation : `/#/my-packs?cancelled=1`
