# Simulation exacte du deploy mainnet

## Limite de cet environnement CI/agent

La simulation **on-chain** (`mxpy --simulate`) n’a **pas** pu être exécutée ici faute de :

- Rustc ≥ 1.78 / `sc-meta` pour produire le `.wasm`
- Docker (build alternatif)
- PEM mainnet

Le chiffre **exact** `txGasUnits` s’obtient **sur ta machine ou Vellum** avec le script ci-dessous.

## Commande (copie-colle)

```bash
export PEM=~/wallets/xartists-mainnet.pem
export FEE_BPS=300

chmod +x scripts/*.sh
./scripts/simulate_deploy_mainnet.sh agents-marketplace
./scripts/simulate_deploy_mainnet.sh nft-marketplace
```

Lire dans la sortie :

```json
"txGasUnits": 12345678
```

Puis :

```bash
export GAS_LIMIT=$((txGasUnits * 115 / 100))   # +15% marge
./scripts/deploy_mainnet.sh agents-marketplace
```

## Estimation théorique (sans wasm)

Config mainnet live : `gas_price=1e9`, `gas_per_data_byte=1500`, modifier exec `0.01`.

| Taille wasm | Data gas approx | Fee data EGLD |
|-------------|-----------------|---------------|
| 40 KB | ~61 M | ~0,061 |
| 60 KB | ~92 M | ~0,092 |
| 80 KB | ~123 M | ~0,123 |
| 100 KB | ~154 M | ~0,154 |
| 150 KB | ~230 M | ~0,230 |
| 200 KB | ~307 M | ~0,307 |

**Ancien défaut 80 M gas** : insuffisant dès que le wasm dépasse ~**50 KB**.  
**Nouveau défaut scripts** : `GAS_LIMIT=200000000` (surchargeable).

Exécution `init(fee_bps)` : en général **&lt; 0,001 EGLD** (tarif ×0,01).

## Vellum

```text
1. sc-meta all build in contracts/agents-marketplace and nft-marketplace
2. mxpy contract deploy --simulate --gas-limit 600000000 --arguments 300 --chain 1
3. Record txGasUnits per contract
4. Deploy --send with GAS_LIMIT = txGasUnits * 1.15
5. Report: wasm bytes, txGasUnits, fee paid, contract address
```
