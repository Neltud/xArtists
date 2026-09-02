# Oracles de prix — xArtists / LIA

## Réalité MultiversX

Il n’y a **pas** de contrat Chainlink déployé par xArtists. Les prix « on-chain leaning » viennent de l’**indexeur MultiversX**, lui-même alimenté par l’activité DEX on-chain (xExchange et pairs ESDT).

| Source | Type | Poids |
|--------|------|-------|
| `api.multiversx.com/economics` | Index réseau EGLD | élevé |
| `api.multiversx.com/tokens/{id}` | Prix token indexé on-chain | élevé |
| `XEXCHANGE_PRICE_URL` (optionnel) | Mid DEX custom | élevé |
| CoinGecko EGLD | CEX / centralisé | faible |

## Config

Fichier : `data/oracle_config.json`

- Paires : EGLD-USD, WEGLD-USD, USDC-USD, TRO-USD  
- Policy : `max_age_sec=120`, `max_deviation=5%`, poids on-chain vs CEX  

## Commandes

```bash
# Snapshot multi-token
python -m lia.oracles.price_oracle

# Publish + mirrors Pages
python -m lia.oracles.publish

# Cadence Vellum (oracles → board → mirror)
./scripts/vellum_board_cadence.sh
```

Sorties :
- `data/oracle_prices.json`
- `data/egld_price.json` (legacy)
- mirrors `docs/data/` + `apps/frontend/public/data/`

## Frontend

`useOraclePrice` lit d’abord `oracle_prices.json`, sinon economics API live.

## Règles trading

- Ne jamais exécuter live sur **une seule** source stale  
- $TRO illiquide → display only, pas cash treasury  
- `LIA_LIVE_TRADING=0` jusqu’à micro-proof  

## Tests

```bash
python tests/regression/test_oracle_config.py
./scripts/run_regression.sh
```
