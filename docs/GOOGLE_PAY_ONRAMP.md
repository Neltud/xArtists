# Google Pay — intégration xArtists

## Approche

**Google Pay via MoonPay** (`paymentMethod=google_pay`), en parité avec Apple Pay.

Paramètre MoonPay : [on-ramp widget parameters](https://dev.moonpay.com/widget/on-ramp/customization/parameters) — valeurs `google_pay`, `apple_pay`, `credit_debit_card`, etc.

## UI

- Bouton principal **Payer avec Google Pay** dans `FiatOnRampModal`
- Liste Express : Google Pay en premier
- `MoonpayButton` avec `paymentMethod="google_pay"`

## Config

```env
VITE_MOONPAY_PUBLIC_KEY=pk_live_…
```

Sans clé → `buy-staging.moonpay.com`.

## Compatibilité client (hint)

`maySupportGooglePay()` détecte Chrome / Android / Edge — **MoonPay** décide de l’éligibilité réelle (région, moyen de paiement Google, merchant).

## Parité Apple / Google

| Moyen | `paymentMethod` | Hint UI |
|-------|-----------------|--------|
| Google Pay | `google_pay` | Chrome / Android |
| Apple Pay | `apple_pay` | Safari / iOS |
| Carte | `credit_debit_card` | — |

Voir aussi [APPLE_PAY_ONRAMP.md](APPLE_PAY_ONRAMP.md).
