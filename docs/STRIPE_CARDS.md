# Stripe — paiements carte (xArtists)

## Rôle

| Flux | Provider |
|------|----------|
| **Packs IA** (Pulse / Yield / Sentinel) en € | **Stripe Checkout** (carte) |
| On-ramp **EGLD** crypto | **MoonPay** (Apple Pay / Google Pay / carte) |

Stripe **ne remplace pas** MoonPay pour acheter de l’EGLD on-chain. Stripe paie le **produit access pack** (fiat) ; le mint NFT suit le webhook.

## Frontend

| Fichier | Rôle |
|---------|------|
| `lib/stripe.ts` | Session API + Payment Links |
| `PackCheckout.tsx` | CTA carte Stripe |
| `StripeCardBanner.tsx` | Statut config |

## Variables d’environnement (Pages / Vite)

```env
# Backend qui crée la session (secret Stripe côté serveur UNIQUEMENT)
VITE_ACCESS_API_BASE=https://api.example.com

# Optionnel — affiché / analytics
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_…

# Fallback sans backend : Payment Links Dashboard
VITE_STRIPE_PAYMENT_LINK_PULSE=https://buy.stripe.com/…
VITE_STRIPE_PAYMENT_LINK_YIELD=https://buy.stripe.com/…
VITE_STRIPE_PAYMENT_LINK_SENTINEL=https://buy.stripe.com/…
```

## Contrat API backend

`POST {ACCESS_API_BASE}/v1/checkout/session`

```json
{
  "pack_id": "pulse",
  "buyer_address": "erd1…",
  "success_url": "https://neltud.github.io/xArtists/#/my-packs?paid=1",
  "cancel_url": "https://neltud.github.io/xArtists/#/my-packs?cancelled=1",
  "currency": "eur",
  "provider": "stripe",
  "mode": "payment"
}
```

Réponse :

```json
{ "id": "cs_…", "url": "https://checkout.stripe.com/…" }
```

### Serveur (référence)

```text
stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],
  line_items: [{ price: PRICE_ID_FOR_PACK, quantity: 1 }],
  success_url, cancel_url,
  client_reference_id: buyer_address,
  metadata: { pack_id, buyer_address }
})
```

### Webhook

`checkout.session.completed` → vérifier signature → mint / queue mint NFT pack vers `buyer_address` (jamais la clé secrète en front).

## Sécurité

- `sk_live_…` **uniquement** serveur / Vellum secret store  
- Front : `pk_` optionnel + URLs session  
- Idempotence webhook par `session.id`  

## Test

1. Cartes test Stripe `4242…`  
2. Success → `/#/my-packs?paid=1`  
3. Sans API ni Payment Link → intent `localStorage` paper  
