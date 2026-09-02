# Analyse approfondie xArtists / LIA — 2026-08-09

## 1. Architecture en couches

| Couche | Composants | État |
|--------|------------|------|
| **dApp (Pages)** | React routes, sdk-dapp, honesty banners | Live consultatif |
| **Data plane** | `data/*.json` → `public/data/` | Présent (status 200) |
| **Cognitive** | mvx_agent, desk_debate, swarm_roles, GSN | Paper OK |
| **Guardian** | preflight, modes DEFENSE, profit_lock | OK |
| **Execution paper** | compound_engine, swarm_compound_bridge | OK |
| **Execution live** | UniversalExecutor / PEM | Gate `LIA_LIVE_TRADING=0` |
| **On-chain product** | marketplace, agents_marketplace | **codeHash null / null** |

## 2. Séparation des identités (critique UX)

| Surface | Qui | Ne pas confondre avec |
|---------|-----|------------------------|
| `/wallet` | User connecté | LIA ops |
| `/portfolio` | **LIA protocole** (wallet ops) | User portfolio |
| `/agents` packs | Sub-agents vendus 5–25€ | Swarm LIA / GSN |
| GSN leaderboard | Prévisions score | Packs marketplace |
| Swarm | Agents paper LIA ops | Produit vendu |

BottomNav : `LIA` → `/portfolio`, `Wallet` → `/wallet` — correct.

## 3. Flux de valeur (réel vs théorique)

```
Fees market ──► (SC non déployé) ──► 0 on-chain aujourd'hui
Tips         ──► wallet ops / memo
PnL LIA live ──► bloqué (flag 0)
Packs agents ──► bloqué (agents_marketplace null)
```

Treasury fondation = encore surtout solde ops + NFT + TRO illiquide.  
Le modèle fees+tips+LIA est **conceptuellement** cohérent ; **matériellement** il dépend du deploy SC.

## 4. Stack trading autonome (paper)

```
oracles → gas → board → social → mvx_agent
       → swarm (DEFENSE→MOM/MR/ARB→YIELD)
       → desk fuse → mode → Guardian → compound / bridge
```

Pipeline **v1.3.1** + step `swarm`.  
Bridge : décision swarm → CompoundCircuit.open/tick/close → lock path.

**Limites honnêtes :** edge paper ≠ live ; arb = block-time ; path $1M = expectancy (~1279 +1% purs depuis $3).

## 5. Risques prioritaires

| ID | Risque | Mitigation | Reste |
|----|--------|------------|-------|
| R1 | Market empty | Bandeaux UI | Deploy + codeHash |
| R2 | Confusion user/LIA | Labels Portfolio/Wallet | Continuer InfoTip |
| R3 | Live sans preuve | Flag 0 | Micro-TX gates |
| R4 | Vote DAO faux | Read-only | Garder |
| R5 | Conversion Buy | SC null | P0 deploy |

## 6. Parcours utilisateur (KPI rétention)

1. **Artiste** : `/studio` → IPFS → mint → list (bloqué sans SC)
2. **Collectionneur** : `/gallery` → `/marketplace` → Buy (bloqué)
3. **$TRO** : `/tro` `/dao` lecture
4. **Curieux IA** : `/` board, `/agents`, `/trading`

Goulot conversion : **signature wallet + SC live**.

## 7. Prochaines actions ordonnées

1. PEM + EGLD → deploy agents-marketplace FEE_BPS=300 + nft-marketplace
2. `post_deploy` + `verify_marketplace_codehash`
3. VITE_* + rebuild Pages — retirer bandeaux
4. Micro List/Buy **wallet user**
5. Vellum : `run_autonomous --mode integrated` + `board.publish`
6. `LIA_LIVE_TRADING=1` seulement après micro-proofs

## 8. Verdict

Produit **avancé en paper + front honest** ; **pas encore machine à cash on-chain**.  
ROI max restant = **déploiement SC**, pas plus de strategies paper.
