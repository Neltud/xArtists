# RWA xArtists × MultiversX Supernova

## Contexte
Supernova (finalité sub-seconde, perf chain) change le **latence budget** des sagas multi-étapes et des preuves micro-live. Le RWA xArtists (physique / escrow) reste **fail-closed**.

## Stack déjà dans le repo
| Module | Rôle |
|--------|------|
| `packages/capital-escrow-pack` | Capital agent isolé par NFT |
| `lia/rwa/*` | Bridge events / hooks RWA |
| Validator RWA escrow (safety pack) | State machine hors pool partagé |
| Saga / Intent / Policy | Multi-step + compensation |

## Solution proposée (alignée Supernova)
1. **Escrow on-chain** par asset RWA / pack (pas de pool contagieux)
2. **Oracle prix** (`lia/oracles`) pour valorisation USDC avant settlement
3. **Mémoire chain** (`lia/memory/onchain_memory.py`) = audit trail des transitions
4. **Saga** : lock → verify → release / compensate ; finalité rapide = timeouts plus courts, mêmes états
5. **Guardian** avant toute sortie de fonds

## Ordre d’implémentation
1. Paper + validator (fait)
2. SC mint agents + codeHash
3. SC capital escrow
4. SC RWA escrow (après micro-live trading prouvé)
5. Optim timeouts saga pour finalité Supernova

## Non-objectifs immédiats
Tokeniser tout le monde réel sans custody légale ; bridge cross-chain sans health circuit.
