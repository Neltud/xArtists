# Apple Pay — intégration xArtists

## Approche

**Apple Pay via MoonPay** (`paymentMethod=apple_pay`).

Parité Google Pay : [GOOGLE_PAY_ONRAMP.md](GOOGLE_PAY_ONRAMP.md).

## Code

| Fichier | Rôle |
|---------|------|
| `lib/moonpay.ts` | URL + hints Apple/Google |
| `FiatOnRampModal.tsx` | Boutons Google Pay + Apple Pay |
| `ExpressPaymentOptions.tsx` | Liste express |
| `MoonpayButton.tsx` | CTA paramétrable |

## Config

```env
VITE_MOONPAY_PUBLIC_KEY=pk_live_…
```

## UX

⌘K → `buy 50 EGLD` → **Payer avec Apple Pay** / **Google Pay**.

Widget hors iframe (`window.open`) — requis pour wallet pays MoonPay.
