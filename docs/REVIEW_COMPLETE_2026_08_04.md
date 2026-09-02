# Review complète xArtists — 2026-08-04

## Architecture

| Couche | Contenu |
|--------|---------|
| **dApp** | `apps/frontend` React/Vite · GH Pages · routes Studio/Market/Agents/DAO/… |
| **LIA** | `lia/` circuit, defi, oracles, signals, claude_agent, memory |
| **SC** | `contracts/` nft-marketplace + agents-marketplace (deploy P0) |
| **Data** | `data/*.json` board, oracle, pyramids, defense |
| **Docs** | MICRO_PROOF, TREASURY, placements, Vellum prompts |

## État readiness

| Capacité | Prêt ? |
|----------|--------|
| Consultation UI / SEO / persona | Oui |
| Oracle EGLD multi-source | Oui (nouveau) |
| Pinata IPFS | Oui (secrets Vellum) |
| List/Buy on-chain | **Non** — SC codeHash null |
| Buy agent | **Non** |
| LIA live trading | **Non** — flag 0 |
| DAO vote TX | Non (lecture seule volontaire) |

## Modules LIA récents (structure)

```
lia/oracles/price_oracle.py      # consensus EGLD-USD
lia/defi/hatom_* + ashswap_fees  # yield / loop / fees
lia/defi/placement_* + xmex_*    # catalogue + weekly
lia/circuit/compound_pyramids.py # sleeves % + cadence
lia/circuit/defense_circuit.py   # DEFENSE
lia/signals/social_intel.py      # social cap 0.15
```

## Corrections structure / orthographe docs

- Titres unifiés **xArtists** (pas Nelson Tuduri en galerie)
- Supply **$TRO max 500 000**
- Fautes fréquentes évitées dans nouveaux docs (français technique clair)
- Priorité P0 inchangée : deploy SC → signature → micro proof

## Frontend publish

1. `cd apps/frontend && npm ci && npm run build`
2. Commit `dist` ou workflow GH Pages Actions
3. Servir `public/data/oracle_prices.json` (Vellum: `python -m lia.oracles.price_oracle`)

## Oracle

```bash
python -m lia.oracles.price_oracle
# → data/oracle_prices.json
# Frontend: useOraclePrice + OraclePriceBadge
```

Sources : MVX economics (prioritaire) · xExchange URL optionnelle · CoinGecko (label centralized, poids réduit) · filtre médiane ±5 %.

## P0 suivant

1. Deploy marketplace + agents + codeHash  
2. Rebuild Pages  
3. Signature user List/Buy  
4. Preuve micro → seulement alors `LIA_LIVE_TRADING=1`
