---
hidden: true
noIndex: true
---

# Suite logique — 9 novembre 2026

Probe `api.multiversx.com` : epoch **2288** · EGLD **$2.96** · mcap **$92.17M** · APR **9.11 %** · LIA Ops **0.907888 EGLD** nonce **1487** (inchangé) · $TRO circ **476 224** / **557** comptes · liquidité ~$11.90.

## Fait

* Le site public reste le seul go-live. Ce n’est pas un go-live trading.
* `classifyUtterance` (`xartists.lia.classifier.v1`) refuse injection, flags live, `claimFees`, bridge SPL, swap, stake et transfert.
* Un pack au tarif catalogue (110 / 75 / 50) produit un devis papier, `payable: false`.
* 29 vecteurs `node:test`.

## Ne pas faire

* Appeler ce déploiement un go-live financier.
* Signer LIA Ops, recharger le hot wallet, `claimFees`, `PAYBOX_ENV=prod`.
* Vendre un pack tant que les URI et la livraison ne sont pas prouvées.
* Lire la baisse EGLD ($3.44 → $2.96) comme une instruction.

## Ordre

1. Garder le classifieur paper dans la CI access-api.
2. Journal de mandat signé et anti-rejeu (#369), sans broadcast.
3. Deux répliques IPFS et preuve de read-back (#402) avant le mint Genesis (#403).
4. Séparer les adaptateurs EUR et EGLD (#370) sans les armer.
5. Après une notice de maintien (fenêtre **16–20 nov**) : une TX **utilisateur** journalisée. Pas un `xo` Ops.
