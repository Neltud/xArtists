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
| `apps/frontend/src/hooks/useAgentsMarketplace.ts` | Build TX list/buy |
| `apps/frontend/src/pages/Agents.tsx` | UI catalogue + formulaires |
| `apps/frontend/src/services/warpService.ts` | Build JSON Warps buy/list |
| `apps/frontend/src/components/WarpButton.tsx` | Copy JSON + deep-link placeholder |
| `packages/core/src/contracts/agentsMarketplaceAbi.ts` | ABI + adresse env |
| `data/warps/*.json` | Templates Warps v3 |
| `lia/vellum/deploy_scs_node.py` | Deploy mxpy / Vellum |

## Config adresse

```bash
export VITE_AGENTS_MARKETPLACE_ADDRESS=erd1qqq...
```

Puis maj `data/contracts.json`. Le frontend recharge aussi `contracts.agents_marketplace` automatiquement si l'env est vide.

### Build / deploy devnet d'abord

1. Workspace Cargo : seuls les crates buildables restent membres du workspace racine.
2. Build isolé :
   ```bash
   cd /home/runner/work/xArtists/xArtists/contracts/agents-marketplace
   mxpy contract build
   ```
3. GitHub Actions :
   - Workflow `Deploy Smart Contracts`
   - `chain=D`
   - `contract=agents-marketplace`
   - `mainnet_gas_verified=false`
4. Mainnet seulement après vérification gas, puis rerun avec `chain=1` et `mainnet_gas_verified=true`.

### Post-deploy frontend

1. Vérifier que `data/contracts.json` contient `contracts.agents_marketplace`.
2. Injecter l'adresse côté frontend :
   ```bash
   export VITE_AGENTS_MARKETPLACE_ADDRESS=erd1...
   ```
3. Rebuild / republier GitHub Pages via le workflow `Deploy xArtists Exclusive`.
4. Si l'env n'est pas injectée, le frontend lit quand même `data/contracts.json` après le déploiement.

## Signature live

```ts
const { plain, tx } = await listAgent(address, nonce, { agentId, priceEgld })
// sendTransactions({ transactions: [tx] }) via sdk-dapp
```

## Preuve live signing Vellum (micro-tx)

```bash
export LIA_LIVE_TRADING=1
export LIA_WALLET_PEM_PATH=/secure/path/lia-wallet.pem
export LIA_CHAIN_ID=1
export LIA_MVX_API=https://api.multiversx.com
export LIA_MVX_PROXY=https://gateway.multiversx.com
python -m lia.executor.universal_executor
```

Checklist :

1. `health()` doit exposer `supernova_mode` et `poll_ms_effective`.
2. Lancer `micro_swap_test_egld_self()` pour une micro self-tx.
3. Vérifier le hash confirmé côté explorer.
4. Ne jamais committer le PEM ; secret Vellum uniquement.

## Tests manuels post-deploy

1. listAgentAction agent_id=`LIA-v6` price=0.01 EGLD  
2. getListing(1) → active=true  
3. buyAgentAction(1) value≥price  
4. listing inactive  
5. cancel par non-seller → fail  
