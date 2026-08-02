# Agents Marketplace — Intégration

## Où va l’EGLD à l’achat ?

Sur `buyAgentAction(listing_id)` payable EGLD :

| Part | Formule | Destination |
|------|---------|-------------|
| **Vendeur** | `price − fee` | `listing.seller` (immédiat) |
| **Protocol** | `price × fee_bps / 10_000` | **Balance du SC** jusqu’à `claimFees` (owner) |

Exemple `fee_bps = 300` (3 %) : prix 1 EGLD → **0,97 au seller**, **0,03 treasury SC**.

Doc complète : [`TREASURY_FLOWS.md`](TREASURY_FLOWS.md).

Les revenus agents **ne** alimentent **pas** le compound LIA 70/30 (circuit trading séparé).

---

## SC (Rust)

`contracts/agents-marketplace/src/lib.rs`

| Endpoint | Payable | Args |
|----------|---------|------|
| `listAgentAction` | non | agent_id (buffer), price (BigUint EGLD atomic) |
| `buyAgentAction` | **EGLD** | listing_id (u64) |
| `cancelListing` | non | listing_id |
| `claimFees` | non | — (owner only → withdraw SC EGLD) |
| `getListing` | view | listing_id |
| `getFeeBps` | view | — |
| `getContractEgldBalance` | view | — |
| `getOwner` | view | — |

Init: `fee_bps` (ex. 300 = 3%). Owner = deployer.

---

## Frontend

| Fichier | Rôle |
|---------|------|
| `src/hooks/useAgentsMarketplace.ts` | Build TX list/buy/cancel (si présent) |
| `src/pages/Agents.tsx` | GreenSmoke + catalogue limited + fee split |
| `packages/core` ABI | Align endpoints + views |
| `VITE_AGENTS_MARKETPLACE_ADDRESS` | Adresse post-deploy |
| `VITE_AGENTS_FEE_BPS` | Affichage fee UI (défaut 300) jusqu’à view on-chain |

Copy checkout recommandée :

> Vous payez **P** EGLD · Frais protocol **X %** · Créateur reçoit **P − fee**.

---

## Config adresse

```bash
export VITE_AGENTS_MARKETPLACE_ADDRESS=erd1qqq...
export VITE_AGENTS_FEE_BPS=300
```

Puis `data/contracts.json` → `agents_marketplace`.

---

## Tests manuels post-deploy

1. `listAgentAction` agent_id=`LIA-v6` price=0.01 EGLD  
2. `getListing(1)` → active=true  
3. `buyAgentAction(1)` value≥price → seller reçoit net, SC garde fee  
4. listing inactive  
5. `getContractEgldBalance` > 0  
6. `claimFees` from non-owner → fail  
7. `claimFees` from owner → EGLD → owner, balance SC 0  
8. cancel par non-seller → fail  
