# Parcours démo xArtists (2–6 min)

Shell live : https://neltud.github.io/xArtists/  
Tour guidé : https://neltud.github.io/xArtists/#/demo  
GO_LIVE : https://neltud.github.io/xArtists/#/go-live  
Slot : https://neltud.github.io/xArtists/#/slot  
Hard refresh (Ctrl+Shift+R) après chaque deploy Actions.

## 0. `/demo`
- 10 étapes cliquables + tableau de gates **live/dégradé** (API, codeHash, LIA funded, Supernova, MX-8004)
- Banner haut de page → Tour démo
- Probe `/stats` indépendant — plus d’epoch figé ; accounts/econ en last-known si indexer down

## 1. Home `/`
- Persona, Pulse strip, **NetworkLiveStrip** (epoch / EGLD / LIA Ops / statut indexer)
- Chrome paper — pas un marché live

## 2. Galerie `/museum`
- Collections API NFT (NFTUDURI-2990b6 lisible même indexer partiel)

## 3. Packs `/agents`
- Pulse · Yield · Sentinel — catalogue paper
- Achat on-chain **OFF** (pas de codeHash)

## 4. Tours `/tours`
- Service CULTURE — pas un pack agent

## 5. Wallet `/wallet`
- Connect lecture. User ≠ LIA Ops

## 6. Board `/trading`
- Paper compounding. `LIA_LIVE_TRADING=0`

## 7. Analyse `/market`
- Stats lecture. List/Buy/Bid fail-closed

## 8. Primordial Slot `/slot`
- Bank TRO paper, scatter, jackpot RWA 1/1 **locké**

## 9. Sim Lab `/simulation`
- Client-side only

## 10. `/go-live`
- Checklist opérateur : **indexer healthy** → dest wallets → PEM → simulate → deploy → verify

## Limites honnêtes (24 sept)
- SC marketplace / agents / staking / gov / minter / slot : **non déployés**
- LIA live trading : **OFF**
- LIA Ops **~2.09 EGLD** last-known · nonce 1468 (19 Sep) — accounts API **down** 24 Sep
- Treasury dest wallets **null**
- Recovery hardfork v2.1.3.0 : **pas de TX ops** tant que `/accounts` ≠ 200
- On-ramp réel = redirect MoonPay
