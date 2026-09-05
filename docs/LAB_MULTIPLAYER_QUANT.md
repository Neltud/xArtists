# LAB — Multiplayer musée + QuantOracle

Propositions Claude affinées pour xArtists.

## Multiplayer (R3F)

- Fichier : `apps/frontend/src/lab/museum/MultiplayerScene.tsx`
- **Opt-in** : `VITE_MULTIPLAYER_URL=https://…` (Socket.IO)
- Sans URL → no-op (démo GH Pages OK)
- Room id = `museumId` (louvre, orsay…)
- Emit position throttlé (~80 ms), lerp avatars distants
- Dépendance optionnelle `socket.io-client` (dynamic import)

### Correctifs vs snippet d’origine

| Problème | Fix |
|----------|-----|
| `localhost:8000` hardcodé | env `VITE_MULTIPLAYER_URL` |
| emit chaque frame | throttle 80 ms |
| `socket.disconnect` au unmount room | cleanup propre + `user_left` |
| bloquant sans serveur | dynamic import + garde |

## QuantOracle

- Front : `apps/frontend/src/lab/quant/quantOracle.ts`
- Ops : `lia/lab/quant_oracle.py`
- Chaîne primaire **MultiversX** (pas Polygon Alchemy en démo)
- Whale / hype = **paper signals** pour Market / LIA board
- Social / Vellum = couche payante séparée (placeholder 0.5)

## Hors scope démo live

- Serveur Socket.IO production
- Webhooks whale on-chain
- Auto-trading sur événement whale
