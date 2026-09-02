# Opération Trinity — Structure & contrats

**Date :** 2026-08-28  
**Phase :** Structure + types (Étape 1) — pas de mainnet gasless live

## Workstreams

| WS | Branche logique | Module repo | Livrable |
|----|-----------------|-------------|----------|
| **BRAIN** | feature/lia-brain | `packages/lia-intelligence/` | String → LIP JSON |
| **RELAYER** | feature/the-relayer | `packages/core-protocol/relayer/` | Cycle CREATED→CONFIRMED + décimales |
| **UI** | feature/command-bar | `apps/frontend` IntentBar + `packages/ui-components/` | États Thinking / Success / Error |

## Arbres

```
packages/
  core-protocol/     # types LIP, constants $TRO, guardian, payment-gateway
  lia-intelligence/  # parser, intent-engine, llm-adapter (stubs)
  ui-components/     # CommandBar reference (Vite front reste source prod)
  agent-modules/
    travel/          # Travel Concierge (lifestyle — pas pack IA)
    x-artists/       # IP / mint metadata
infra/
  terraform/         # EKS/RDS blueprint (non provisionné)
  monitoring/        # Grafana War Room + alert_rules
docs/
  OPERATION_TRINITY.md
  WAR_ROOM_GRAFANA.md
  BIG_BANG_ROADMAP.md
  AI_GOVERNANCE.md
contracts/ethereum/  # LIATROToken + GenesisSale (réf. ETH 18 decimals)
```

## Politique $TRO (source de vérité)

- Cap **500 000** par chaîne · total théorique **1 000 000**  
- Décimales : **18** Ethereum · **6** MultiversX (ESDT TRO-94c925)  
- Wallets isolés : `lia_ops` ≠ user ≠ eth_deploy  

## Règle produit

Packs IA = Pulse · Yield · Sentinel.  
Travel = module lifestyle / tours.  
X-Artists = IP / NFT.  
Relayer gasless = **paper / future** jusqu’à infra + audits.
