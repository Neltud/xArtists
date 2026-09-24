# Ops Ads — publier une créative (V1)

## Principe
- Enchère / location d’espace **pas un investissement**.
- 1 créative active max par slot (`home_hero`, `market_sidebar`, `studio_banner`, `drop_feature`).
- SC enchères = V2. V1 = paiement EGLD manuel + publication JSON.

## Tunnel
1. Bidder envoie EGLD vers LIA Ops avec memo `ad-bid:<slot>:<period>`.
2. Ops vérifie tx explorer MultiversX.
3. Créative :
   - **IPFS** : upload image → CID (`imageCid: "bafy…"`), ou
   - **HTTPS** : `imageUrl` (weserv recommandé si CORS).
4. Mettre à jour `apps/frontend/public/data/ads_active.json` (+ miroir `docs/data/` si sync).
5. Commit `main` → GitHub Pages. Hard-refresh clients.
6. Retirer / `status: "ended"` à expiration.

## GO_LIVE / SC
Ne pas activer `VITE_MARKETPLACE_CODEHASH_OK` ni agents pour les ads.
Ads restent off-chain (JSON + transfer).
