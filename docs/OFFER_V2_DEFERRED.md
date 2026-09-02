# Offer V2 — différé jusqu’à volume

## V1 (maintenant)

- Bouton **Offer** = info only (pas d’endpoint)
- **Bid** on-chain quand marketplace live (`placeBid` / `acceptBid` / `withdrawBid`)
- Pas d’escrow « offre libre » hors listing

## Pourquoi différer

- Complexité SC (lock EGLD, timeout, cancel, dispute)
- Surface audit + gas
- Bid sur listing couvre le besoin principal post-deploy

## Quand ouvrir Offer V2

- Market live + GMV / volume listings significatif
- Spec escrow : lock → accept seller → transfer NFT ou refund
- Tests blackbox + audit externe recommandé

## Produit

Ne pas promettre « Offer » comme feature live dans le marketing tant que SC absent.
