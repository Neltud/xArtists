# MoonPay — on-ramp EGLD

## Secrets Pages (jamais committer la secret key)

```
VITE_MOONPAY_API_KEY=pk_test_…   # ou pk_live_…
```

Optionnel — préremplir `walletAddress` signé :

```
VITE_ACCESS_API_BASE=https://ton-api.example.com
```

Backend `POST /moonpay/sign` body `{ "url": "https://buy.moonpay.com/?..." }` → `{ "signature": "..." }`  
HMAC-SHA256 avec la **secret key** MoonPay (serveur uniquement).

## UI

- `/wallet` — bouton **Acheter / Recharger EGLD · MoonPay**
- Sans clé : hint de config, pas de crash

## Flux produit

1. User achète EGLD (carte) → wallet MultiversX  
2. Puis stake / market / venue on-chain  

MoonPay ≠ paiement pack fiat (Stripe/Paybox restent pour packs EUR).
