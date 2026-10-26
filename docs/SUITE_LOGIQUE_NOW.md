---
hidden: true
noIndex: true
---

# Suite logique — 26 octobre 2026

Probe 2026-10-26T05:36:31Z : epoch **2274** · EGLD **$3,23** · mcap **$100,3M** · APR **9,10 %** · LIA Ops **1.585598 EGLD** nonce **1479** · packs **10 / 5 / 2,5** · market **0,0175** · slot **0,5000** · $TRO circ **476 224** / **562** comptes · ~$0.0000796.

## Fait dans ce push (0.122.0)

* Le site se republie. Ce n’est **pas** un go-live trading. `/go-live` le dit en tête.
* Compteur de prolongation : jour **3/29** (tranches de 24 h depuis le 23 oct 06:02 UTC). **21 jours** avant le 16 nov, **26 jours** avant le 21 nov 00:00 UTC.
* Fallback `networkProbe` et snapshots publics alignés sur ce probe. Le 25 oct (epoch 2273, $3,30) n’est plus le repli.
* Le README ne confond plus la preuve historique d’un achat à 0,25 EGLD avec le solde market **0,0175**.
* `VITE_LIA_LIVE_TRADING=0`. Paybox **501**. Slot REAL fermé. Hashes SC inchangés.

## Ne pas faire

* Appeler ce déploiement un go-live trading.
* Nouveau swap / wrap / liquidité sur LIA Ops. Nonce figé à 1479 depuis le 17 oct.
* Allumer le live parce que le 23 oct est passé, parce que le site est « en ligne », ou parce qu’une annonce FET Bithumb tombe le 2–6 nov.
* Paybox ou Stripe réels. `claimFees`. Fonds vers placeholders vides.
* `VITE_*_CODEHASH_OK=1` dans git.
* Annoncer un fonds. Confondre Connect visiteur et LIA Ops.
* Ouvrir le slot REAL ou déployer un second slot.
* Merger Vite 8 / ESLint 10.
* Traiter une reprise éventuelle des retraits Upbit comme une levée du warning. Ce sont deux portes.

## Ordre seulement après un maintien publié (Upbit ou Bithumb, après le 20 nov ou plus tôt si une notice lève le warning **et** les retraits)

1. Une TX **utilisateur** sur l’explorer (1 TRO staké, ou Sentinel 2,5 EGLD, ou buy/bid listing **#2** — jamais l’id #1).
2. Un seul micro-trade ops signé xPortal, journalisé, caps `liaConfig` (15 USD / trade, 40 USD / jour).
3. Inscription MX-8004 / First 100.
4. Upgrade **du même** slot en payable, puis 1 spin poussière.
5. Akash `VITE_BRAIN_WS` seulement si l’endpoint répond.
6. Paybox : secrets preprod hors git, IPN prouvée, puis seulement `VITE_PAYBOX_ENABLED`.

## D’ici le 16–20 nov

Rester paper. Le travail utile est la lisibilité publique (galerie, musée, market en lecture, packs affichés, `/go-live` honnête, repli réseau à jour). Pas de capital nouveau.
