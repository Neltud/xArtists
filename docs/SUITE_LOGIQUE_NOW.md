# Suite logique — 20 octobre 2026

Probe : epoch **2268** · EGLD **$3,65** · LIA Ops **1,5856 EGLD** nonce **1479** · packs **10 / 5 / 2,5** · listing **#2 actif** · slot **non payable**.

## Fait dans ce push

- Page `/go-live` : pulse API (epoch, EGLD, LIA) + phrase Upbit qui bascule seule après le 23 oct.
- Plus de prix marketplace inventé à 0,25 EGLD.
- Stamp Pages **0.117.0**. Client `VITE_LIA_LIVE_TRADING=0`.

## Ne pas faire

- Nouveau swap / wrap / liquidité sur LIA Ops. Le 17 oct 12:57–13:02 UTC a déjà consommé ~0,018 EGLD de frais et de wrap. La fenêtre Upbit est **ouverte**.
- Paybox ou Stripe réels (pas d’IPN, pas de mint lié).
- `VITE_*_CODEHASH_OK=1` dans git.
- Fonds vers placeholders vides. `claimFees` (treasury dest null).
- Annoncer un fonds. Confondre Connect visiteur et LIA Ops.
- Ouvrir le slot REAL (`isPayable=false`, min bet 0,001, house 0,50).

## Ordre dès qu’Upbit publie un maintien

1. Une TX **utilisateur** visible sur l’explorer (1 TRO staké, ou Sentinel 2,5 EGLD, ou buy/bid #2 — jamais l’id #1).
2. Un seul micro-trade ops signé xPortal, journalisé, caps déjà dans `liaConfig` (15 USD / trade, 40 USD / jour).
3. Inscription MX-8004 / First 100.
4. Upgrade **du même** slot en payable, pas un nouveau deploy, puis 1 spin poussière.
5. Akash `VITE_BRAIN_WS` seulement si le endpoint répond. L’index listings on-chain est déjà le chemin d’achat.

## Si Upbit delist ou prolonge

Rester paper. Ne pas « go live trading ». Le site SC (galerie, musée, market lecture, packs) peut rester public.
