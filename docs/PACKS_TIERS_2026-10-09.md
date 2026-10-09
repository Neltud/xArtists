# Packs différenciés — 2026-10-09

| Pack | Tier | Prix list | Accès clé |
|------|------|----------|-----------|
| **Pulse** | **COMPLET** | 25 EGLD | CC hub + salle Pulse + TCA + LIA full + tape multi-actifs + signaux HF + DeFi + risk |
| **Yield** | LIMITÉ · DEFI | 15 EGLD | Salle Yield + CC room Yield + Hatom/LP lecture — **pas** TCA, trading HF, LIA full, hub CC |
| **Sentinel** | LIMITÉ · GUARD | 10 EGLD | Salle Sentinel + alertes risk — **pas** exécution agressive, TCA, LIA full |

## Source code

- `apps/frontend/src/config/agentPacks.ts` — `features`, `mergePackFeatures`
- `apps/frontend/src/lib/holderAccess.ts` — `features` / `isFull` sur `HolderStatus`
- UI `/agents` — badges COMPLET / LIMITÉ + listes inclus / limites

## Règle produit

1 pack = 1 salle 3D. **Seul Pulse** ouvre la suite complète. Cumuler plusieurs packs empile les features (Pulse domine).
