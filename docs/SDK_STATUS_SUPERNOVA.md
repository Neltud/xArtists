# SDK & Supernova — état xArtists (MAJ 2026-09-15)

## Réseau (probe API live)

| Item | Valeur |
|------|--------|
| Supernova mainnet | **LIVE** |
| Activation | ~**10 Sep 2026** · epoch **2233** |
| Epoch actuel (probe) | **2237** |
| `refreshRate` / round | **600 ms** |
| `roundsPerEpoch` | 144000 |
| Shards | 3 (+ meta) |
| Config ref | [v2.0.6.0](https://github.com/multiversx/mx-chain-mainnet-config/releases/tag/v2.0.6.0)+ |

```bash
curl -s https://api.multiversx.com/stats | jq '{epoch, refreshRate, roundsPerEpoch, roundsPassed}'
# → epoch 2237, refreshRate 600, …
```

Hub : https://supernova.multiversx.com/

## Impact dApp

| Sujet | Posture |
|-------|--------|
| Confirmations TX | Plus rapides (~600 ms rounds) |
| Demo paper | OK — lecture mainnet |
| Product SC | Toujours **NOT_DEPLOYED** (`codeHash` null) |
| sdk-dapp | Repo **v3** range — migration **v5** = chantier séparé (breaking) |

## Frontend packages (repo)

| Package | Range repo | Note |
|---------|------------|------|
| `@multiversx/sdk-dapp` | `^3.0.0` | Pas bump forcé sur main sans rewrite wallet |
| `@multiversx/sdk-core` | `^13.0.0` | Aligner avec v5 quand branche `feat/sdk-dapp-v5` |
| `@multiversx/sdk-network-providers` | `^2.0.0` | Zone OK |

### Migration v5 (P1 avant fonds live massifs)

1. Branche `feat/sdk-dapp-v5`  
2. Install v5 + core 16 + tests login  
3. Ajuster `TransactionWatcher` pour rounds 600 ms  
4. Merge seulement si CI Pages vert  

## Demo posture

- **GO_DEMO** · paper  
- SoftStatus : Supernova badge si `isSupernovaLive()`  
- Pas de promesse gasless / SC live  

## xArtists verdict

Supernova est **en production réseau**.  
xArtists produit reste **GO_DEMO** jusqu’à SC `codeHash` + executor live gated.
