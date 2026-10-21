# Suite logique — 21 octobre 2026

Probe ~04:35 UTC : epoch **2269** · EGLD **$3,73** · LIA Ops **1,585598 EGLD** nonce **1479** · packs **10 / 5 / 2,5** · market payable **0,0175** · slot **0,5000 non payable** · $TRO circ **476 224** / **562** comptes.

## Fait dans ce push

- `/go-live` : pulse élargi (agents, market, slot, $TRO) + jour de fenêtre Upbit/Bithumb.
- Stamp Pages **0.118.0**. `VITE_LIA_LIVE_TRADING=0`.
- Version du package frontend alignée (elle était restée à 0.113.0).

## Ne pas faire

- Nouveau swap / wrap / liquidité sur LIA Ops. Nonce figé à 1479 depuis le 17 oct.
- Allumer le live parce que la fenêtre est « bientôt finie ». Au 21 oct aucune annonce de maintien Upbit ou Bithumb.
- Paybox ou Stripe réels.
- `VITE_*_CODEHASH_OK=1` dans git.
- Fonds vers placeholders vides. `claimFees`.
- Annoncer un fonds. Confondre Connect visiteur et LIA Ops.
- Ouvrir le slot REAL ou déployer un second slot.

## Ordre seulement après un maintien publié (Upbit ou Bithumb)

1. Une TX **utilisateur** sur l’explorer (1 TRO staké, ou Sentinel 2,5 EGLD, ou buy/bid listing **#2** — jamais l’id #1).
2. Un seul micro-trade ops signé xPortal, journalisé, caps `liaConfig` (15 USD / trade, 40 USD / jour).
3. Inscription MX-8004 / First 100.
4. Upgrade **du même** slot en payable, puis 1 spin poussière.
5. Akash `VITE_BRAIN_WS` seulement si l’endpoint répond.

## Si delist ou prolongation

Rester paper. Le site (galerie, musée, market en lecture, packs) reste public. Ne pas appeler ça un go-live trading.
