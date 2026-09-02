# Parcours utilisateur — Agents · Fiat · Escrow

## A. Achat crypto (EGLD déjà en wallet)

1. Connect wallet **user** (pas LIA)  
2. `/agents` → choisir pack  
3. **Buy** on-chain (`agents_marketplace`) — **bloqué tant que SC null**  
4. Fulfillment : clé API 1× + droits NFT badge  
5. Option **Stake** : `openStake(agent_id)` sur **agent-stake-escrow** avec fonds de départ  
6. `agent_live` défaut off ; opt-in user  

## B. Achat carte (fiat)

1. Choisir produit : NFT | $TRO | Agent  
2. `create_onramp_session` (MoonPay / xMoney)  
3. Paiement carte sur provider  
4. Webhook → `mark_fiat_paid`  
5. Conversion / buy on-chain (EGLD → NFT/TRO/agent)  
6. Même fulfillment + stake optionnel  

Env : `MOONPAY_API_KEY`, `XMONEY_PAYMENT_URL_TEMPLATE` (Vellum/backend only).

## C. Isolation

Fonds stake user **≠** pyramides LIA. Voir `docs/LIA_VS_SUBAGENTS.md`.

## D. Contrats

| SC | Rôle | Deploy |
|----|------|--------|
| agents-marketplace | list/buy packs | P0 |
| agent-stake-escrow | lock EGLD départ | P1 après agents |
| nft-marketplace | NFT | P0 |

## E. Modules code

- `lia/payments/fiat_onramp.py`  
- `lia/agents/isolation.py`  
- `lia/agents/fulfillment.py` + api_keys + nft_rights + agent_stake  
- `contracts/agent-stake-escrow`  
