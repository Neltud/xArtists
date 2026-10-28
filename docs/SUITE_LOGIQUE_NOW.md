---
hidden: true
noIndex: true
---

# Suite logique — 28 octobre 2026

Probe 2026-10-28T06:14:47Z : epoch **2276** · EGLD **$3,37** · mcap **$104,65M** · APR **9,15 %** · LIA Ops **1.585598 EGLD** nonce **1479** · packs **10 / 5 / 2,5** · market **0,0175** · slot **0,5000** · $TRO circ **476 224** / **562** comptes · ~$0.0000837 · 2814 tx.

## Fait dans ce push (0.124.0)

* Le site se republie via `static.yml`. Ce n’est **pas** un go-live trading. `/go-live` le dit en tête.
* Compteur de prolongation, au probe : jour **6/29** (tranches de 24 h depuis le 23 oct 06:02 UTC). **19 jours** avant le 16 nov, **24 jours** avant le 21 nov 00:00 UTC. Le client recalcule ; le markdown ne fige pas l’horloge.
* Fallback `networkProbe` et snapshots publics alignés sur ce probe. Le 27 oct (epoch 2275, $3,22) n’est plus le repli.
* Hashes SC inchangés. Slot toujours non payable. LIA nonce toujours 1479.
* `VITE_LIA_LIVE_TRADING=0`. Paybox **501**. Slot REAL fermé.
* PR [#200](https://github.com/Neltud/xArtists/pull/200) **non mergée** : lockfile access-api détruit, base derrière `main`, `unstable`.

## Ne pas faire

* Appeler ce déploiement un go-live trading.
* Nouveau swap / wrap / liquidité sur LIA Ops. Nonce figé à 1479 depuis le 17 oct.
* Allumer le live parce que le prix est remonté à $3,37, parce que le 23 oct est passé, parce que le site est « en ligne », parce qu’une annonce FET Bithumb tombe le 2–6 nov, ou parce qu’une notice concerne un autre actif.
* Paybox, Stripe ou Neon réels. `claimFees`. Fonds vers placeholders vides.
* Merger la PR #200 tant que `npm ci` n’est pas rétabli et que la base n’est pas rebasée sur `main`.
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
6. Paybox : secrets preprod hors git, IPN prouvée, puis seulement `VITE_PAYBOX_ENABLED`. Le store Neon vient **après**, avec un lockfile complet, pas à la place.

## D’ici le 16–20 nov

Rester paper. Le travail utile est la lisibilité publique (galerie, musée, market en lecture, packs affichés, `/go-live` honnête, repli réseau à jour). Pas de capital nouveau. Prochain probe utile : à chaque epoch qui change le chrome public, ou dès qu’une notice KR bouge.
