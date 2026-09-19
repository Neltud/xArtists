# Parcours démo xArtists (2–6 min)

Shell live : https://neltud.github.io/xArtists/  
Tour guidé : https://neltud.github.io/xArtists/#/demo  
GO_LIVE : https://neltud.github.io/xArtists/#/go-live  
Hard refresh (Ctrl+Shift+R) après chaque deploy Actions.

## 0. `/demo`
- 9 étapes cliquables + tableau de gates **live** (codeHash, LIA funded, Supernova epoch)
- Banner haut de page → Tour démo
- Probe `/stats` + comptes — plus d’epoch figé

## 1. Home `/`
- Persona, Pulse strip, **NetworkLiveStrip** (epoch / EGLD / LIA Ops)
- Chrome paper — pas un marché live

## 2. Galerie `/museum`
- Collections API NFT

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

## 8. Sim Lab `/simulation`
- Client-side only

## 9. `/go-live`
- Checklist opérateur : dest wallets, PEM, simulate → deploy → verify

## Limites honnêtes (19 sept)
- SC marketplace / agents / staking / gov / minter : **non déployés**
- LIA live trading : **OFF**
- LIA Ops **~2.09 EGLD** · nonce 1468 — **suffisant deploy** ; PEM hors git
- Treasury dest wallets **null**
- On-ramp réel = redirect MoonPay
