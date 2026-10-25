# Suite logique — 25 octobre 2026

Probe ~04:45 UTC : epoch **2273** · EGLD **$3,30** · mcap **$102,4M** · APR **9,07 %** · LIA Ops **1,585598 EGLD** nonce **1479** · packs **10 / 5 / 2,5** · market **0,0175** · slot **0,5000** · $TRO circ **476 224** / **562** comptes · ~$0,0000807.

## Fait dans ce push (0.121.0)

- Le site se republie. Ce n’est **pas** un go-live trading. `/go-live` le dit en tête.
- Compteur de prolongation : jour **2/29** (24 h depuis le 23 oct 06:02 UTC). **22 jours** avant le 16 nov, **27 jours** avant le 21 nov 00:00 UTC.
- La carte entité ne sert plus le snapshot du 17 oct (1,603782 EGLD, nonce 1473). Elle lit l’API, et le JSON de repli est celui du 25 oct.
- `VITE_LIA_LIVE_TRADING=0`. Paybox **501**. Slot REAL fermé. Hashes SC inchangés. `getPackPrice` confirmé **10 / 5 / 2,5**.

## Ne pas faire

- Appeler ce déploiement un go-live trading.
- Nouveau swap / wrap / liquidité sur LIA Ops. Nonce figé à 1479 depuis le 17 oct.
- Allumer le live parce que le 23 oct est passé, ou parce que le site est « en ligne ».
- Paybox ou Stripe réels. `claimFees`. Fonds vers placeholders vides.
- `VITE_*_CODEHASH_OK=1` dans git.
- Annoncer un fonds. Confondre Connect visiteur et LIA Ops.
- Ouvrir le slot REAL ou déployer un second slot.
- Merger Vite 8 / ESLint 10.
- Traiter une reprise éventuelle des retraits Upbit comme une levée du warning. Ce sont deux portes.

## Ordre seulement après un maintien publié (Upbit ou Bithumb, après le 20 nov ou plus tôt si une notice lève le warning **et** les retraits)

1. Une TX **utilisateur** sur l’explorer (1 TRO staké, ou Sentinel 2,5 EGLD, ou buy/bid listing **#2** — jamais l’id #1).
2. Un seul micro-trade ops signé xPortal, journalisé, caps `liaConfig` (15 USD / trade, 40 USD / jour).
3. Inscription MX-8004 / First 100.
4. Upgrade **du même** slot en payable, puis 1 spin poussière.
5. Akash `VITE_BRAIN_WS` seulement si l’endpoint répond.
6. Paybox : secrets preprod hors git, IPN prouvée, puis seulement `VITE_PAYBOX_ENABLED`.

## D’ici le 16–20 nov

Rester paper. Le travail utile est la lisibilité publique (galerie, musée, market en lecture, packs affichés, `/go-live` honnête). Pas de capital nouveau.
