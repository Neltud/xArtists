# GO Live — gates S1 + S2 (exhaustif)

> Commercial packs + mint live **interdits** tant que S1 et S2 ne sont pas verts.

## État runtime (2026-11-02)

| Item | Status |
|------|--------|
| Release | **0.127.0** |
| Pages deploy | success (`static.yml`) |
| E2E | soft-success post pin |
| GenesisCard3D live | oui (`xa-g3d` / `NFT_BACK` in bundle) |
| PackLanding `/packs/:id` | oui |
| mint-on-payment | paper only |
| LIA live | `VITE_LIA_LIVE_TRADING=0` |
| Open PRs | 0 |

## S1 — Paiement réel (Sentinel 50 €)

### Prérequis
- [ ] access-api prod : `PAYBOX_IPN_URL` HTTPS, JWT secret, fail-closed
- [ ] `VITE_PAYBOX_ENABLED=true` **seulement** après IPN edge tests verts
- [ ] Quote Rule1 : 50 € → amount_egld = ceil4(50/rate)
- [ ] Whop one_time Sentinel plan OK **ou** PayBox order path

### Procédure
1. Wallet test `erd1…` connecté sur Pages
2. Ouvrir `/packs/sentinel` → Checkout dApp **ou** Whop checkout plan Sentinel
3. Payer **50 €** réel (carte)
4. Vérifier IPN : HTTP 200, signature valide, order `server_confirmed`
5. Logs access-api : pas de double-credit, amount digits stricts
6. Capturer : order id, tx fiat id, timestamp UTC

### Critères verts S1
- Order status `paid` / `server_confirmed=true`
- Aucun pack débloqué **uniquement** via `?paid=` query (déjà bloqué)
- Fail-closed si IPN invalide (401/400)

## S2 — My Packs NFT proof

### Prérequis
- [ ] S1 vert
- [ ] Collections XAIPLS / XAIYLD / XAISNT opérationnelles
- [ ] `mint-on-payment` path live **ou** mint-3-packs-to-admin smoke puis transfer buyer
- [ ] PEM / relayer hors CI publique

### Procédure
1. Post-S1 : déclencher mint SFT Sentinel nonce N → `buyer`
2. Metadata = `buildMintMetadata('sentinel', N, 777)` (peinture+hud)
3. Wallet buyer : token visible explorer MultiversX
4. Pages → My Packs : badge **on-chain** + `GenesisCard3D` + identifier
5. Salle Sentinel déverrouillée via `matchOnChainPacks`

### Critères verts S2
- `chainHits` non vide pour sentinel
- Identifier `XAISNT-…-…` affiché
- Pas de dépendance au paper `localStorage` pour le droit durable

## Après S1+S2 → GO partiel packs

1. Activer mint live gated (`CONFIRM=LIVE_MINT_MAINNET`)
2. Garder LIA paper jusqu'à gate trading séparé
3. Communiquer catalogue 110/75/50 — pas d'APY

## Hors scope GO packs

- TCA Membership (abonnement) — produit séparé, pas de mint
- LIA live trading
- React 19 / RR7 / sdk-core 16 migrations

## Liens smoke

- https://neltud.github.io/xArtists/#/packs/pulse
- https://neltud.github.io/xArtists/#/packs/yield
- https://neltud.github.io/xArtists/#/packs/sentinel
- https://neltud.github.io/xArtists/#/workspace/agents (My Packs alias selon routes)
