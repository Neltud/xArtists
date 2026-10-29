# Runbook A→B — PayBox sandbox puis production marchande

Date : 2026-10-29  
API : `https://xartists-access-api.onrender.com`  
Site : `https://neltud.github.io/xArtists/`

## Preuves runtime (avant secrets)

| Test | Résultat |
|------|----------|
| `GET /health` | 200 · `orders_backend: postgres` · JWT/SIWX on |
| `paybox_configured` | **false** · `paybox_mode: off` |
| `POST /v1/checkout/quote` + `rate_eur_per_egld` | Pulse 11000 · Yield 7500 · Sentinel 5000 ✅ |
| `POST /v1/checkout/paybox` sans JWT | **401** `buyer_auth_required` ✅ |
| Stripe / MoonPay | off |
| `LIA_LIVE_TRADING` | doit rester `0` (indépendant des packs) |

Quote **exige** un taux FX : `rate_eur_per_egld` (ou `rate` / `fx`). Sans taux → `invalid_fx_rate`.

Session carte : **`POST /v1/checkout/paybox`** (pas `/session`).

---

## A — Armer SANDBOX (preprod PayBox)

### Secrets Render (Environment) — ne jamais committer

```
PAYBOX_SITE=<site preprod>
PAYBOX_RANG=<rang preprod>
PAYBOX_IDENTIFIANT=<id preprod>
PAYBOX_HMAC_KEY=<hmac hex ≥16 chars>
PAYBOX_ENV=preprod
PAYBOX_DEVISE=978
PAYBOX_IPN_URL=https://xartists-access-api.onrender.com/v1/checkout/paybox/ipn
ACCESS_JWT_SECRET=<secret fort ≥32 chars>
ACCESS_PUBLIC_BASE=https://neltud.github.io
CORS_ORIGIN=https://neltud.github.io
DATABASE_URL=<Neon déjà présent>
LIA_LIVE_TRADING=0
```

`payboxConfig.ready` = site + rang + hmac (≥16). Identifiant recommandé.

Endpoint TPE preprod : `https://preprod-tpeweb.paybox.com/cgi/MYchoix_pagepaiement.cgi`

### Recette A (ordre)

1. Redeploy / restart service après secrets.
2. `GET /health` → `paybox_configured: true`, `paybox_mode: preprod`.
3. SIWX / JWT buyer (challenge + verify) → Bearer token.
4. `POST /v1/checkout/quote` body :
   ```json
   { "pack_id": "pulse", "rate_eur_per_egld": 3.24 }
   ```
   Attendu : `amount_cents: 11000`.
5. `POST /v1/checkout/paybox` + `Authorization: Bearer <jwt>` + `pack_id`.
   Attendu : `ok: true`, `url` preprod, `fields.PBX_HMAC`, `order_id`.
6. Paiement carte **test** preprod → IPN `POST/GET /v1/checkout/paybox/ipn`.
7. `GET /v1/checkout/paybox/order/<order_id>` authentifié → `server_confirmed` / PAID.
8. My Packs UI : pack visible **uniquement** après confirmation serveur (pas `?paid=`).
9. Rejeu IPN → **pas** de double mint / double transition.

### Cartes test PayBox preprod

Utiliser le jeu de cartes officiel Verifone/PayBox preprod (doc v8.3). Ne pas documenter de numéros ici si non stables ; se référer au manuel merchant.

### Critères A VERT

- [ ] health paybox preprod true
- [ ] 3 quotes OK (110/75/50)
- [ ] 401 sans JWT
- [ ] 1 ordre PAID via IPN signé RSA-2048
- [ ] idempotence IPN
- [ ] My Packs aligné serveur
- [ ] zero `LIA_LIVE_TRADING=1`

---

## B — PRODUCTION marchande

**Interdit tant que A n’est pas VERT.**

### Secrets prod (compte merchant live)

```
PAYBOX_SITE=<site prod>
PAYBOX_RANG=<rang prod>
PAYBOX_IDENTIFIANT=<id prod>
PAYBOX_HMAC_KEY=<hmac prod>
PAYBOX_ENV=prod
PAYBOX_IPN_URL=https://xartists-access-api.onrender.com/v1/checkout/paybox/ipn
```

Endpoint TPE prod : `https://tpeweb.paybox.com/cgi/MYchoix_pagepaiement.cgi`

### Contrôles B supplémentaires

1. IPN HTTPS uniquement (déjà enforce code).
2. Montants **uniquement serveur** (`PACK_FIAT_CENTS`) — jamais trust client.
3. Rebuild Pages + smoke Home/Agents/Checkout.
4. Monitoring : alertes IPN `bad_signature`, `amount_mismatch`, volume anormal.
5. Plafonds métier (à définir) : max commandes / IP / jour.
6. Support remboursements : process manuel documenté avant volume.
7. Mentions légales / CGU à jour (SIRET si manquant = risque compliance).

### Critères B VERT

- [ ] A VERT
- [ ] health `paybox_mode: prod`
- [ ] 1 paiement réel micro-montant validé + IPN + My Packs
- [ ] GO écrit humain « production PayBox OK »
- [ ] Plan rollback : `PAYBOX_ENV=preprod` ou retrait des 4 secrets → mode off

### Rollback d’urgence

1. Render : supprimer ou vider `PAYBOX_HMAC_KEY` → `paybox_configured: false`.
2. Ou `PAYBOX_ENV=preprod` si incident prod-only.
3. Annonce status / freeze checkout UI si besoin.

---

## Hors scope B packs

- Mint NFT mainnet automatique
- Escrow physique
- LIA live trading (`VITE_LIA_LIVE_TRADING` / `LIA_LIVE_TRADING`)
- Multichain settlement vendeur

Ces rails ont leurs propres GO.

---

## Action immédiate propriétaire

1. Coller secrets **preprod** sur Render (A).
2. Redéployer → confirmer `/health` paybox true.
3. Ping Grok / chat avec preuve health JSON (sans secrets).
4. Enchaîner recette A 3→9.
5. Seulement ensuite bascule `PAYBOX_ENV=prod` + secrets live (B).
