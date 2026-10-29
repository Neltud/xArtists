# A Sandbox status — 2026-10-29

## A-TECH (API gates) — VERT

Verified against `https://xartists-access-api.onrender.com` after Render secrets + redeploy:

| Check | Result |
|-------|--------|
| `GET /health` | 200 |
| `paybox_configured` | **true** |
| `paybox_mode` | **preprod** |
| `jwt` / `require_siwx` | true |
| `orders_backend` | postgres |
| `lia_live_trading` | **0** |
| Quote Pulse/Yield/Sentinel + `rate_eur_per_egld` | 11000 / 7500 / 5000 |
| `POST /v1/checkout/paybox` without JWT | **401** `buyer_auth_required` |

## A-E2E (paiement → IPN → My Packs) — EN ATTENTE

Requires a real wallet signature (SIWX) + carte test preprod. Cannot be completed server-side without private key.

### Procedure opérateur (5–10 min)

1. Site : `https://neltud.github.io/xArtists/` (rebuild Pages si UI ancienne).
2. Connecter **xPortal** (wallet de test).
3. Agents → pack **Sentinel 50 €** (montant mini) → Checkout PayBox.
4. Compléter JWT/SIWX si demandé.
5. Redirection TPE **preprod** Verifone → carte test officielle.
6. Retour My Packs : attendre **confirmation serveur** (pas seulement `?paid=`).
7. Vérifier `GET /v1/checkout/paybox/order/<id>` avec Bearer → `server_confirmed: true`.
8. Rejouer la même page succès / refresh → **pas** de double livraison.

### Optional Render polish

```
EGLD_EUR_RATE=3.24
```

(allows quote without client FX; `fx_env_configured` currently false)

GitHub Pages var (after A-E2E green):

```
VITE_PAYBOX_ENABLED=true
```

then rebuild workflow `Deploy Vite app to GitHub Pages`.

## B Production — BLOQUÉ

Do not set `PAYBOX_ENV=prod` until A-E2E is green and explicit GO.

## Verdict

- **A-TECH VERT** (rail preprod armé, fail-closed auth OK, prix serveur OK).
- **A-E2E PENDING** (1 paiement test + IPN + My Packs).
- **B NO-GO**.
