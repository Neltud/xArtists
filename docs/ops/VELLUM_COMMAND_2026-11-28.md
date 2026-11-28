# Vellum command — 28 novembre 2026

Lecture et code seulement. Aucun drapeau finance n’est modifié.

## Sonde

| Surface | Observé |
| --- | --- |
| Pages | 0.139.0 · `2d4138cb45fbcfb8a50afa1da2d6dd391837d47f` · 27 nov 20:08 UTC · 140 routes · `lia_live_trading=false` |
| Hub xOrus | HTTP 200 · `293417d9130ede71c6fbf665b82afba9c5a5c604` · stance ABSTAIN · exécution, signature, custody et paiement fermés · 0 wallet |
| `api.xartists.art` | NXDOMAIN |
| MultiversX | Opérationnel au 27 nov (statut public, pas une preuve de session xPortal) |
| WalletConnect provider dApp | Toujours la série 5 dans `apps/frontend`. Le correctif amont 6.2.0 n’est pas repris ici. |

## Ce que cette tranche livre

`packages/vellum-command` classe une intention (achat fiat, swap, stake $TRO, rééquilibrage, vente NFT, pack, statut, pause) et refuse le vidage, la signature immédiate et le dépassement du plafond pilote de 5 USD.

`/vellum/` est une page statique qui importe ce moteur. Consigner écrit dans l’appareil, pas sur un serveur.

## Ce qui reste humain

1. [#506](https://github.com/Neltud/xArtists/issues/506) allowlist Reown et QR xPortal.
2. [#428](https://github.com/Neltud/xArtists/issues/428) deux hashes Explorer, deux wallets.
3. [#341](https://github.com/Neltud/xArtists/issues/341) réception `hello@`.
4. Un seul rail fiat, après webhook et cadre légal. Pas MoonPay, Apple Pay et PayBox le même jour.

xPortal a branché Pegaroute pour son propre routage (26 nov). Ce n’est pas l’adaptateur xArtists. Aucun écart de prix n’est affiché tant qu’un quote frais n’est pas signé.
