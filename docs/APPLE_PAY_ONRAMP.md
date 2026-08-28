# Apple Pay — intégration xArtists

## Approche retenue

**Apple Pay via MoonPay hosted widget** (`paymentMethod=apple_pay`).

Pourquoi pas Apple Pay JS natif seul sur GitHub Pages :

- Nécessite un **Merchant ID** Apple + domaine vérifié + session serveur
- MoonPay gère KYC, conformité et règlement crypto (EGLD)
- Doc MoonPay : widget **hors iframe** (on utilise `window.open`)

Réf. paramètres : [MoonPay on-ramp parameters](https://dev.moonpay.com/widget/on-ramp/customization/parameters) — `paymentMethod` inclut `apple_pay`, `google_pay`, `credit_debit_card`.

## Code

| Fichier | Rôle |
|---------|------|
| `apps/frontend/src/lib/moonpay.ts` | `buildMoonpayBuyUrl` / `openMoonpayBuy` |
| `MoonpayButton.tsx` | CTA + `paymentMethod` |
| `FiatOnRampModal.tsx` | Bouton **Payer avec Apple Pay** + Express |
| `ExpressPaymentOptions.tsx` | Apple / Google / Card / MoonPay |

## Config

```env
VITE_MOONPAY_PUBLIC_KEY=pk_live_…   # ou pk_test_…
```

Sans clé → `buy-staging.moonpay.com` (démo).

## UX

1. Connecter wallet (erd1) recommandé  
2. ⌘K → `buy 50 EGLD` ou Home → On-Ramp  
3. **Payer avec Apple Pay** → MoonPay avec `paymentMethod=apple_pay`  
4. Safari / iOS + carte dans Wallet Apple  

## Limites

- Disponibilité Apple Pay = région + appareil + compte MoonPay merchant  
- Pas de webhook secret en front (serveur pour ORDER_COMPLETED)  
- $TRO : on-ramp en **EGLD** puis swap (xExchange) tant que MoonPay ne liste pas TRO  
