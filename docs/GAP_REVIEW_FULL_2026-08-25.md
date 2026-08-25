# Review complète dApp xArtists — lacunes (2026-08-25)

## Maturité par domaine

| Domaine | Maturité | Notes |
|---------|----------|-------|
| Front Vite/React + routes | **Élevée** | Trading, packs, staking UI, paper badges |
| Oracle prix | **Élevée** | `lia/oracles/*` + publish pipeline |
| Compounding 10 col + 1% | **Moyenne+** | v2 doctrine + annual sim + UI |
| Mémoire on-chain | **Moyenne** | `lia/memory/onchain_memory.py` existe |
| Vellum production_run | **Élevée** | gates → pipeline → compounding soft → mirror |
| Guardian / policy / intent | **Moyenne+** | modules présents, path live gated |
| SC mint agents | **Faible** | codeHash null — bloque mint réel |
| SC staking / escrow | **Faible** | specs + validators, pas deploy prod |
| Capital holder % dépôt | **Spec** | docs + validator |
| Intel marketplace agents→LIA | **Catalog** | quote paper only |
| RWA / Supernova | **Spec** | docs + rwa hooks |
| IPFS media NFT | **Partiel** | Pinata path, media PENDING ops |
| Live trading | **OFF** | correct |

## Lacunes P0 (bloquantes live)
1. **SC agents marketplace** non déployé / codeHash null
2. **Micro-preuves** on-chain insuffisantes pour `allow_live_trading`
3. **PEM + EGLD** ops pour deploy seulement sous flags
4. **Wire mirror** : s’assurer que `compounding_*.json` + `lia_intel_catalog.json` sont dans publish list

## Lacunes P1
5. Settlement pay intel (USDC) on-chain
6. SC capital-escrow + UI Fund live
7. RWA SC après trading micro-live
8. Enrichir front annual_sim panel
9. Cadence release git / Pages automatisée stable

## Lacunes P2
10. Xmvx social diffusion pro
11. Ledger UX / WC domain polish
12. Multi-pay mint (EGLD + USDC + TRO)

## Ce qui est correct
- Paper-first, badges, isolation capital NFT
- Oracle déjà intégré au pipeline
- 10 colonnes : pas de max trades produit, cœur 1%, pertes possibles (sim annuel)
- Vellum brief autonomie documenté

## Prochaine action ops
```bash
git pull
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.compounding.annual_yield_sim
PYTHONPATH=. python -c "from lia.marketplace.intel_catalog import publish_catalog; publish_catalog()"
PYTHONPATH=. CHAIN=1 python -m lia.vellum.production_run
```
