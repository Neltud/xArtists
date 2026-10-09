# Checkout packs — Crypto vs Fiat (FC rail)

## Deux rails UX

| Rail | Moyen | Effet |
|------|--------|--------|
| **1 · Crypto** | EGLD (xPortal) · on-ramp MoonPay si besoin | Mint NFT pack on-chain quand SC agents LIVE |
| **2 · Fiat / FC** | Stripe carte · Paybox / SEPA EUR-RON · futur FC/broker | Paiement gateway → **webhook Access API** → mint erd1 |

Composant : `apps/frontend/src/components/CheckoutModal.tsx`  
Entrée page packs : `PackCheckout` → modal.

## Secrets (Pages / Actions — jamais en git)

- `VITE_STRIPE_*` / payment links ou `VITE_ACCESS_API_BASE`
- Paybox URL ou API
- `VITE_MOONPAY_API_KEY` (on-ramp EGLD seulement)
- Webhook secret côté serveur Access (mint après `payment_intent.succeeded`)

## LIA isolée

- **LIA** = agent analytique + paper / shadow — **pas** de gestion de compte titres, **pas** de broker dans le checkout.
- Le capital utilisateur n’est pas confié à LIA pour exécution (voir `FUNDING_MODELS.C_no_user_capital` dans `agentPacks.ts`).
- Mint pack ≠ dépôt trading LIA.

## Flux fiat (ops)

1. User choisit pack + rail Fiat → Stripe/Paybox
2. Gateway confirme → webhook `POST /access/webhook`
3. Serveur vérifie signature + montant + `erd1`
4. Relayer / owner mint pack NFT → adresse buyer
5. Front : `/my-packs` lit ownership on-chain (pas localStorage comme preuve d’achat)

## Aperçu appareil

Toujours libellé **pas un achat / pas de NFT** — UI only.
