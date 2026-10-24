# Suite logique — 24 octobre 2026

Probe ~04:40 UTC : epoch **2272** · EGLD **$3,46** · mcap **$107,3M** · APR **9,06 %** · LIA Ops **1,585598 EGLD** nonce **1479** · packs **10 / 5 / 2,5** · market **0,0175** · slot **0,5000** · $TRO circ **476 224** / **562** comptes.

## Fait dans ce push (0.120.0)

- La revue 19–23 oct est **close par une prolongation**, pas par un maintien.
  - Upbit notice **207379109** (23 oct 06:02 UTC) : warning jusqu’au **16–20 nov 2026**.
  - Bithumb : warning EGLD + FET prolongé le 23 oct.
- `upbitPosture` a une phase `extended`. Le 24 oct 04:40 UTC = **jour 1** de cette prolongation.
- `/go-live` affiche enfin le pulse public. Le module existait, il n’était branché nulle part.
- `VITE_LIA_LIVE_TRADING=0`. Paybox **501**. Slot REAL fermé.

## Ne pas faire

- Appeler ce déploiement un go-live trading. Le site qui se republie est un **go-live de posture**.
- Nouveau swap / wrap / liquidité sur LIA Ops. Nonce figé à 1479 depuis le 17 oct.
- Allumer le live parce que le 23 oct est passé. L’annonce de ce jour-là est l’extension.
- Paybox ou Stripe réels. `claimFees`. Fonds vers placeholders vides.
- `VITE_*_CODEHASH_OK=1` dans git.
- Annoncer un fonds. Confondre Connect visiteur et LIA Ops.
- Ouvrir le slot REAL ou déployer un second slot.
- Merger Vite 8 / ESLint 10.

## Ordre seulement après un maintien publié (Upbit ou Bithumb, après le 20 nov ou plus tôt si une notice lève le warning)

1. Une TX **utilisateur** sur l’explorer (1 TRO staké, ou Sentinel 2,5 EGLD, ou buy/bid listing **#2** — jamais l’id #1).
2. Un seul micro-trade ops signé xPortal, journalisé, caps `liaConfig` (15 USD / trade, 40 USD / jour).
3. Inscription MX-8004 / First 100.
4. Upgrade **du même** slot en payable, puis 1 spin poussière.
5. Akash `VITE_BRAIN_WS` seulement si l’endpoint répond.
6. Paybox : secrets preprod hors git, IPN prouvée, puis seulement `VITE_PAYBOX_ENABLED`.

## D’ici le 16–20 nov

Rester paper. Travailler le site public (galerie, musée, market en lecture, packs affichés) et la lisibilité de `/go-live`. Pas de capital nouveau.
