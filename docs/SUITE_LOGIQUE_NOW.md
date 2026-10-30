---
hidden: true
noIndex: true
---

# Suite logique — 30 octobre 2026

Probe 2026-10-30T05:36:00Z : epoch **2278** · EGLD **$3,21** · mcap **$99,73M** · APR **9,13 %** · LIA Ops **1.585598 EGLD** nonce **1479** · packs **10 / 5 / 2,5** · market **0,0175** · slot **0,5000** · $TRO circ **476 224** / **561** comptes · ~$0.00007902 · 2815 tx.

## Fait dans ce push (0.125.0)

* Le site se republie via `static.yml`. Ce n’est **pas** un go-live trading.
* Le repli réseau ne sert plus le 28 oct (epoch 2276, $3,37).
* La copie `/go-live` ne dit plus que les retraits Upbit sont suspendus. Au 30 oct le statut public est **retraits ouverts, dépôts bloqués, désignation toujours là**.
* `VITE_LIA_LIVE_TRADING` reste armé pour une **micro-signature xPortal** (caps 15 / 40 USD). Le bouton proposals « Sign & broadcast » reste verrouillé : il n’a pas de signer.
* `VITE_PAYBOX_ENABLED` redevient **false** par défaut. Le rail Render reste preprod. Prod Paybox = NO-GO tant que l’IPN test n’est pas verte.
* Hashes SC inchangés. Slot non payable. LIA nonce 1479.
* PR [#200](https://github.com/Neltud/xArtists/pull/200) **non mergée**.

## Ne pas faire

* Appeler ce déploiement un go-live trading parce que le drapeau user-sign est à 1, parce que les retraits Upbit sont revenus, ou parce que le site est en ligne.
* Nouveau swap / wrap / liquidité sur LIA Ops.
* Allumer le live parce que le prix est à $3,21, parce qu’une annonce FET tombe le 2–6 nov, ou parce qu’INIT est en revue.
* `PAYBOX_ENV=prod`. `claimFees`. Fonds vers placeholders vides.
* Merger la PR #200 tant que `npm ci` n’est pas rétabli.
* `VITE_*_CODEHASH_OK=1` dans git.
* Déverrouiller « Sign & broadcast » sans brancher un `signAndSend` utilisateur et sans garde KR.
* Merger Vite 8 / ESLint 10.
* Ouvrir le slot REAL.

## Ordre seulement après un maintien publié (Upbit ou Bithumb, après le 20 nov ou plus tôt si une notice lève le warning **et** que les dépôts ne sont plus la porte fermée qu’on croit)

1. Une TX **utilisateur** sur l’explorer (1 TRO staké, ou Sentinel 2,5 EGLD, ou buy/bid listing **#2** — jamais l’id #1).
2. Un seul micro-trade ops signé xPortal, journalisé, caps `liaConfig`.
3. Inscription MX-8004 / First 100.
4. Upgrade **du même** slot en payable, puis 1 spin poussière.
5. Akash `VITE_BRAIN_WS` seulement si l’endpoint répond.
6. Paybox : une carte test preprod + IPN + My Packs sans double livraison, **puis** la variable `VITE_PAYBOX_ENABLED=true`. Le store Neon vient après, avec un lockfile complet.

## D’ici le 16–20 nov

Le travail utile est la lisibilité publique (galerie, musée, market en lecture, packs, `/go-live` honnête, repli réseau à jour) et la recette Paybox preprod. Pas de capital nouveau sur LIA Ops.
