---
hidden: true
noIndex: true
---

# Paybox (e-Transactions) — intégration xArtists

## Statut

* **Front branché** : choix Stripe / Paybox dans `PackCheckout` (`lib/payments.ts`, `lib/paybox.ts`).
* **Backend** : scaffold `services/access-api` + `services/access_pack` — prix **uniquement serveur**.
* **Sécurité prix (2026-10-18)** : le client n’envoie plus `amount_cents`. Le serveur lit le catalogue (`PACK_CATALOG`) et ignore toute valeur client. Contournement URL directe bloqué (GET refusé).

## Prix commerciaux EUR (source de vérité)

| Pack     | EUR | cents |
| -------- | --- | ----- |
| Pulse    | 110 | 11000 |
| Yield    | 75  | 7500  |
| Sentinel | 50  | 5000  |

Fichiers alignés :

* `services/access_pack/catalog.py`
* `services/access-api/src/server.mjs` (miroir Node)
* `apps/frontend/src/config/agentPacks.ts` (affichage uniquement)

## Principe

Comme MoonPay / Stripe hosted : **aucune clé secrète en front**. Le navigateur ouvre une URL de paiement préparée et signée par le backend.

## Front

* `VITE_ACCESS_API_BASE` → `POST /v1/checkout/paybox`
* `VITE_PAYBOX_PAYMENT_URL` — fallback URL backend / redirect (sans amount en query)
* `startPayboxCardPayment({ packId, buyerAddress })` — amountEur optionnel (display only)

## Backend

1. Recevoir `pack_id`, `returnUrl`, `buyer_address` (erd1). **Ne pas utiliser** `amount_cents` client.
2. Lookup `get_pack(pack_id)` → `price_cents` serveur.
3. Signer les paramètres Paybox (HMAC / module officiel e-Transactions) avec `PBX_TOTAL = price_cents`.
4. Répondre `{ "url": "https://preprod-tpeweb.paybox.com/...", "order_id": "…", "amount_cents": … }`.
5. IPN : valider signature → même pipeline mint que Stripe webhook.

## Return URLs front

* Succès : `/#/my-packs?paid=1`
* Annulation : `/#/my-packs?cancelled=1`

## Stripe (parcours 1) — rappel

* `POST /v1/checkout/session` ou `VITE_STRIPE_PAYMENT_LINK_{PULSE|YIELD|SENTINEL}`
* Voir `apps/frontend/src/lib/stripe.ts` + `services/access-api/README.md`
