# Packs IA — NFT / SFT d’entitlement

## Principe

Chaque pack (Pulse · Yield · Sentinel) délivre un **token d’entitlement** MultiversX :

| Mode | Usage |
|------|--------|
| **NFT** (nonce unique) | Genesis agents 001/002/003 — 1/1 |
| **SFT** (Meta-ESDT, supply limitée par nonce) | Séries pack (ex. 100 SFT Pulse nonce 10) |

Ce n’est **pas** un produit financier : pas de promesse APR, pas de mandat sur le wallet LIA.

## Collections

| Pack | Ticker | shareOfPackPoolBps |
|------|--------|--------------------|
| Pulse | xAiAx | 4000 (40 %) |
| Yield | xAiAy | 3500 (35 %) |
| Sentinel | xAiAs | 2500 (25 %) |

Métadonnées : `apps/frontend/src/config/packNftMetadata.ts`  
Prix floor : **10 EGLD** (`agentPacks.ts`).

## Mint path (post-GO_LIVE)

1. Issue ESDT collection (NFT ou SFT) via owner ops  
2. Set roles (ESDTRoleNFTCreate / AddQuantity pour SFT)  
3. Mint → transfer buyer après paiement (paper Stripe/Paybox ou EGLD on-chain)  
4. Optional list sur **agents-marketplace** (revente secondaire, fee ≤ 10 %)  

## Rewards

Part des revenus `pack_paper.holders_rewards` (20 %) redistribuée selon `PACK_POOL_SHARE_BPS` une fois **rewards_pool** déployé et vérifié.  
Jusque-là : affichage paper uniquement.
