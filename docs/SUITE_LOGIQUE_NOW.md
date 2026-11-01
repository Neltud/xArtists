---
hidden: true
noIndex: true
---

# Suite logique — 1er novembre 2026

Probe 2026-11-01T05:48:00Z : epoch **2280** · EGLD **$3,44** · mcap **$106,92M** · APR **9,12 %** · LIA Ops **0,907888 EGLD** nonce **1487** · packs **10 / 5 / 2,5** · market **0,0175** · slot **0,5000** · $TRO circ **476 224** / **561** comptes · ~$0.00008223 · 2815 tx.

## Fait dans ce push (0.126.0)

* Le site se republie via `static.yml`. Ce n’est **pas** un go-live trading.
* Le repli réseau ne sert plus le 30 oct (epoch 2278, $3,21, nonce 1479, 1,585598 EGLD).
* Le compteur KR est jour **9/29**, **15 j** / **20 j**. La copie dit que le défaut workflow est **0**, pas 1.
* La rafale du **30 oct 17:20–17:29 UTC** est écrite dans le repli et dans `/go-live` : 8 TX, sortie TROMEX, **7,09 EGLD** vers le owner `$TRO`. Ce n’est pas un succès de mise en prod.
* Correctif CI : retour à la racine avant la copie `_site`, et `BUILD_ID.txt` aligné.
* `VITE_PAYBOX_ENABLED` reste **false**. Slot non payable. Hashes SC inchangés.
* PR [#200](https://github.com/Neltud/xArtists/pull/200) **non mergée**. PR [#221](https://github.com/Neltud/xArtists/pull/221) n’est pas ce déploiement.

## Ne pas faire

* Appeler ce déploiement un go-live trading parce que le site est en ligne, parce que le nonce a bougé, ou parce que 7,09 EGLD sont sortis.
* Nouveau swap / wrap / liquidité / transfert sur LIA Ops. Ne pas recharger le hot wallet.
* Allumer le live parce que le prix est à $3,44, parce que la fenêtre FET s’ouvre le 2 nov, ou parce qu’INIT est en revue.
* `PAYBOX_ENV=prod`. `claimFees`. Fonds vers placeholders vides.
* Merger la PR #200 tant que `npm ci` n’est pas rétabli.
* `VITE_*_CODEHASH_OK=1` dans git.
* Déverrouiller « Sign & broadcast » sans `signAndSend` utilisateur et sans garde KR.
* Merger Vite 8 / ESLint 10.
* Ouvrir le slot REAL.
* Lire la PR release-please comme une autorisation de broadcast.

## Ordre seulement après un maintien publié (Upbit ou Bithumb, après le 20 nov, ou plus tôt si une notice lève le warning **et** que les dépôts ne sont plus la porte fermée)

1. Une TX **utilisateur** sur l’explorer (1 TRO staké, ou Sentinel 2,5 EGLD, ou buy/bid listing **#2** — jamais l’id #1).
2. Pas de micro-trade ops tant que la clé qui a signé le 30 oct n’est pas sous un garde explicite (cold / MPC). Un journal ne suffit plus : la règle écrite a déjà été ignorée.
3. Inscription MX-8004 / First 100.
4. Upgrade **du même** slot en payable, puis 1 spin poussière.
5. Akash `VITE_BRAIN_WS` seulement si l’endpoint répond.
6. Paybox : une carte test preprod + IPN + My Packs sans double livraison, **puis** `VITE_PAYBOX_ENABLED=true`. Le store Neon vient après, avec un lockfile complet.

## D’ici le 16–20 nov

Le travail utile est la lisibilité publique (galerie, musée, market en lecture, packs, `/go-live` honnête, repli réseau à jour) et la recette Paybox preprod. Pas de capital nouveau sur LIA Ops. La fenêtre FET du 2–6 nov se lit, elle ne s’exécute pas.
