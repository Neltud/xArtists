---
hidden: true
noIndex: true
---

# Suite logique — 9 novembre 2026

Sonde `api.multiversx.com` 2026-11-09T06:45:00Z : epoch **2288** · EGLD **2,96 USD** · mcap **92,17 MUSD** · APR **9,11 %** · $TRO supply **476 224** · **557** comptes · **2820** tx · Agents SC **0,033 EGLD**, codeHash inchangé.

## Fait

* Commande papier LIA sur `/go-live` : lecture seule, rails EUR et EGLD séparés, phrases « go live », `claimFees`, `swap`, `stake`, `bridge` refusées avant appariement d’un pack.
* Ledger de mandat à usage unique. `executable` reste false même si l’appelant force `live_authorized`.
* La revue Upbit `207379109` court encore. Il reste **7 jours** avant le 16 nov. Pas une levée.

## Ne pas faire

* Appeler ce déploiement un go-live trading.
* Nouvelle signature LIA Ops. Le gel écrit a déjà été ignoré le 30 oct.
* Ouvrir Paybox, le slot REAL, le bridge Solana, ou un mint Genesis sans URI média prouvée.
* Monter `mx-sdk-js-core` v16 ou Vite dans le même train que la commande papier.

## Après une notice de maintien (Upbit ou Bithumb) et seulement si les dépôts ne sont plus la porte fermée

1. Une TX **utilisateur** journalisée. Jamais un `xo` du wallet ops du 30 oct.
2. Garde exclusive de cette clé (cold / MPC) avant tout micro-trade ops.
3. Preuve média + double réplica IPFS avant toute vente Pulse.
4. Paybox preprod : une carte test, un IPN, une livraison, pas de double crédit. Ensuite seulement le drapeau UI.
5. SDK 16 dans une branche dédiée, avec `test:release` et parcours wallet.

## D’ici le 16 novembre

Lisibilité publique et preuves de livraison. Pas de capital nouveau sur LIA Ops.
