# Matrice d’intégration — LIA-Sovereign blueprints → xArtists

Stack cible **actuelle** : Vite + React + MultiversX (`apps/frontend` + `lia/`).  
Les specs EVM (Wagmi, Sepolia, Foundry Solidity) = **référence produit**, pas portage 1:1.

| Blueprint / concept | Fichier xArtists existant | À créer / statut |
|---------------------|---------------------------|------------------|
| LIA-Sovereign-Core (vision) | `README.md`, `docs/DEMO_READY.md` | Doc vision OK |
| Couche cognitive Monte-Carlo | `lia/brain/probabilistic.py` | Existe |
| Auto-Tuner / Meta / Essaim | `lia/brain/autotuner.py`, `meta_lia.py`, `cycle.py` | Existe (paper) |
| Risk Manager dd 15% | `lia/security/risk_manager.py`, `contracts/risk-manager/` | Existe paper + ref SC |
| Treasury 40/30/20/10 | `docs/TREASURY_POLICY.md`, `contracts/treasury-splitter` | SC deploy pending |
| DecisionProof / « ZK » commitment | `lia/intent/decision_proof.py` | Paper only |
| Pipeline Vellum | `lia/vellum/production_run.py` | Existe |
| Activation phases 1–4 | `docs/VELLUM_DEPLOY.md`, `SC_DEPLOY_COMMANDS.md` | Ops |
| **Intent bar (Cmd+K)** | — | **`IntentBar.tsx`** ✅ |
| Intent parser NLP→JSON | — | **`lib/intentParser.ts`** ✅ (rules, pas LLM) |
| LIA Orchestrator 4 couches | `lia/executor/paper_with_proof.py` + brain | Full omnichain **backlog** |
| **Soul / Reputation score** | — | **`PaperSoulScore.tsx`** ✅ paper |
| Creator / Investor / Gov scores | packs + DAO pages | Heuristique localStorage |
| **LIA Monitor stream** | Commander / ticker | **`LiaMonitor.tsx`** ✅ |
| Identity dashboard (full) | `/wallet`, `/my-packs` | Enrichir plus tard |
| Marketplace card / BuyButton EVM | `Marketplace.tsx`, `useMarketplaceTx` | MVX only; SC soon |
| Marketplace_Escrow Solidity | `contracts/*` Rust MVX | Ne pas merger Sepolia |
| Sovereign Bridge / LayerZero | `lia/rwa/*`, bridge docs | P2 après market MVX |
| Economic flywheel burn | `tro-burn`, Burnify page | SC pending |
| Next.js App Router structure | `apps/frontend` Vite | **Ne pas migrer** sans décision |
| Wagmi / RainbowKit / Sepolia | sdk-dapp MultiversX | **Hors scope** stack actuelle |
| Simulation Lab | `/sim` | Existe |

## Priorité implémentée (cette livraison)

1. Intent Bar — entrée intention → parse local → preview + route  
2. Paper Soul Score — score multidimensionnel local / session  
3. LIA Monitor — flux d’activité paper (brain, risk, fusion)

## Hors priorité (backlog ordonné)

1. Deploy SC MVX marketplace + agents → codeHash  
2. Intent → `production_run` soft hook (API ops)  
3. Soul score on-chain SBT (après identité MVX)  
4. Bridge omnichain (décision produit séparée)
