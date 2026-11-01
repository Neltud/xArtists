# Sprint 1 — CodeHash registry (pin on-chain)

**Date probe** : 2026-11-01  
**Source** : MultiversX API mainnet + `data/contracts.json`  
**Doctrine** : aucune écriture on-chain dans ce livrable — lecture seule + pin documentaire.

## Registre épinglé (live API 2026-11-01)

| SC | Address | codeHash (API) | Owner |
|----|---------|----------------|-------|
| agents_marketplace | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |
| nft_marketplace | `erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm` | `8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc=` | (voir contracts.json) |
| treasury_splitter | `erd1qqqqqqqqqqqqqpgq245sma97w0j9ga9jdgxu36zs0v8g0y6evhxq2nkezv` | `9pB9+UN372QxE77Nj8TUjWn6+Q6qtOPhmmXgUdLnpk8=` | deployer |
| tro_staking_legacy | `erd1qqqqqqqqqqqqqpgqqpc9064q0t33dasd23k2hm36fu5gqp7mvhxq9xvpwf` | `Kz0+zcj7w/3RuOl5m6dumxA9dhFOideb7jGKTam2VVA=` | deployer |
| tro_staking | `erd1qqqqqqqqqqqqqpgqes0a2kryurmt34g7nu4kx9n4ftj77dl5vhxqpe3xf3` | `Jf5ZhzAGu58ez0njdWoZAnRxP7YevYSX9dpO8pGq7SA=` | (contracts.json) |
| slot_casino | `erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f` | `UZ0nX6dWsSgkVqjnFnR5zPNPk1UrNtR5SsrYf96VJCs=` | — |

**Match agents** : API live `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` = `data/contracts.json` → **OK**.

## Owner risk (Sprint 1.2)

Tous les SC critiques sondés ont pour owner le **deployer EOA**  
`erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`.

**Cible** : migrer ownership vers multisig + timelock (plan documenté, exécution hors ce PR).

## Commandes lecture seule

```bash
python scripts/verify_marketplace_codehash.py
python scripts/verify_pinned_codehashes.py   # ce PR
```

## Flags front (ne pas committer `=1` en dur hors secrets Pages)

- `VITE_AGENTS_CODEHASH_OK` seulement si hash on-chain = pin  
- `VITE_MARKETPLACE_CODEHASH_OK` idem  
- `VITE_LIA_LIVE_TRADING=0` toujours par défaut  
