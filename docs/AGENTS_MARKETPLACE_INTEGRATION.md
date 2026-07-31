# Agents Marketplace — Intégration

## SC (Rust)

`contracts/agents-marketplace/src/lib.rs`

| Endpoint | Payable | Args |
|----------|---------|------|
| `listAgentAction` | non | agent_id (buffer), price (BigUint EGLD atomic) |
| `buyAgentAction` | **EGLD** | listing_id (u64) |
| `cancelListing` | non | listing_id |
| `getListing` | view | listing_id |

Init: `fee_bps` (ex. 250 = 2,5%). Fee reste sur le contrat.

## Frontend

| Fichier | Rôle |
|---------|------|
| `src/hooks/useAgentsMarketplace.ts` | Build TX list/buy/cancel |
| `src/pages/MarketplacePage.tsx` | UI catalogue + formulaires |
| `packages/core/src/contracts/agentsMarketplaceAbi.ts` | ABI + adresse env |
| `scripts/deploy_agents_marketplace.sh` | Deploy mxpy |

## Config adresse

```bash
export VITE_AGENTS_MARKETPLACE_ADDRESS=erd1qqq...
```

Puis maj `data/contracts.json` et `CONTRACTS.agentsMarketplace` dans `src/config/contracts.ts`.

## Signature live

```ts
const { plain, tx } = await listAgent(address, nonce, { agentId, priceEgld })
// sendTransactions({ transactions: [tx] }) via sdk-dapp
```

## Tests manuels post-deploy

1. listAgentAction agent_id=`LIA-v6` price=0.01 EGLD  
2. getListing(1) → active=true  
3. buyAgentAction(1) value≥price  
4. listing inactive  
5. cancel par non-seller → fail  
