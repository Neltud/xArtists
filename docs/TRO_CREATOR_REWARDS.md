# Distribution $TRO aux créateurs — LIA / Vellum

## Règles produit

### Mode standard (défaut) — **physique uniquement**

| Event | Reward $TRO | Cap |
|-------|-------------|-----|
| Nouvelle **collection** (type physical / phygital_physical) | **5 TRO** | 1× par collection |
| Nouveau **NFT** dans collection éligible | **1 TRO** / NFT | **max 500 NFT** rewardés par collection |

- Articles **digitaux purs** : **0 TRO** en mode standard.
- Phygital avec composante physique livrable : traité comme **physique** si flag `physical: true` ou `type: physical|phygital`.

### Mode Pro (upgrade)

| Event | Reward $TRO | Cap |
|-------|-------------|-----|
| Nouvelle collection (physical **ou digital**) | **5 TRO** | 1× |
| Nouveau NFT | **1 TRO** / NFT | **max 10_000 NFT** rewardés par collection |

Activation : `TRO_REWARD_MODE=pro` (Vellum env) ou flag ops.

## Qui paie ?

- **Wallet LIA** (protocole) envoie les $TRO (ESDT `TRO-94c925`).
- Live uniquement si `LIA_LIVE_TRADING=1` **et** `TRO_REWARDS_LIVE=1` + PEM.
- Sinon : ledger paper dans `data/tro_rewards_ledger.json`.

## Symbiose objectifs xArtists / LIA

| Objectif | Lien reward |
|----------|-------------|
| Incuber créateurs phygital RWA | 5+1 TRO = bootstrap liquidité attention |
| Déflation $TRO (burn model) | Rewards = **émission ciblée** ; burn fee marketplace compense partiellement |
| Agents / trading LIA | Créateurs restent dans l’écosystème → volume market + agents |
| Cap 500 / 10k | Plafond coût par collection, anti-farm spam |

## Coûts max théoriques (par collection)

| Mode | Collection | NFTs | Max TRO / collection |
|------|------------|------|----------------------|
| Standard physical | 5 | 500 × 1 | **505 TRO** |
| Pro | 5 | 10_000 × 1 | **10_005 TRO** |

## Coût global scénarios (TRO price variable)

Soit `P` = prix $TRO en USD.

| Scénario | Collections | NFTs (éligibles) | TRO out | USD @ P=$0.01 | @ P=$0.10 |
|----------|-------------|------------------|---------|---------------|-----------|
| Soft launch | 20 physical | 2_000 NFT | 20×5 + 2000 = **2100** | $21 | $210 |
| Scale physical | 100 | 20_000 (cap 500×40 avg) | ~500+20k ≈ **25k** ordre | $250 | $2.5k |
| Pro digital open | 50 | 50_000 | risque élevé → **gates** eligibility |

**Budget ops recommandé avant live :** allouer un **pool plafonné** (ex. 50_000 TRO) dans `tro_reward_pool_remaining` ; stop distribution si pool = 0.

## Revenus / compensation

| Source | Direction |
|--------|-----------|
| Marketplace fee 3 % (200 bps treasury + 100 burn sleeve) | EGLD/TRO in |
| Buy agents 3 % | EGLD in |
| LIA trading PnL | EGLD/ESDT in |
| Tip / MoonPay LIA | EGLD in |

**Règle saine :** rewards créateurs ≤ **X %** des fees claimées sur période (ex. 30–50 %) jusqu’à product-market fit.

## Intégration run Vellum

1. Index nouvelles collections/NFT (API MVX ou Studio publish event)
2. `lia.rewards.tro_creators.evaluate_and_queue`
3. Si live + pool > 0 → executor transfer TRO
4. Sinon append ledger paper
5. Publish `data/tro_rewards_ledger.json` + status pool

## Anti-abuse

- 1 reward collection par `collection_id`
- NFT count rewardé ≤ cap mode
- Creator address = issuer / first minter whitelist
- Physical requires metadata flag (voir schema)
- Cooldown / manual review si > N collections / jour / creator
