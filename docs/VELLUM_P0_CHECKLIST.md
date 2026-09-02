# Vellum / LIA — checklist P0 (après GO_DEMO UI)

Le front est en **GO_DEMO**. Vellum tire `main` et exécute le cerveau. Ordre strict :

## 1. Pull & paper cycle
```bash
git pull origin main
python -m lia.vellum.production_run   # CHAIN=1 LIA_LIVE_TRADING=0
# publie data/*.json → commit/push pour Pages
```

## 2. Smart contracts (bloquant commerce)
- [ ] Compile `agents-marketplace` / marketplace Rust
- [ ] Deploy mainnet depuis **wallet LIA ops** (assez d’EGLD)
- [ ] `verify_marketplace_codehash.py` exit 0
- [ ] Mettre adresses dans `data/config.json` + front env

## 3. Micro-preuves user path
- [ ] Tip WC smoke (wallet user)
- [ ] 1 List + 1 Buy (petits montants)
- [ ] Mint pack agent (Pulse / Voyage) paper→on-chain

## 4. Flags live (jamais avant 2+3)
```text
LIA_LIVE_TRADING=0          # défaut
LIA_LIVE_CONFIRMED=1        # ops only après preuves
```

## 5. Modules repo à brancher dans nodes Vellum
| Node idée | Source repo |
|-----------|-------------|
| Intent + policy | `packages/mx-ecosystem-safety` / policy engine |
| Risk lock | `risk_manager_state.json` + Guardian |
| Fusion GSN | `greensmoke_forecasts.json` |
| Voyage soft bias | `voyage_agent.json` weight_cap 0.12 |
| Liquidity | `lia/liquidity/orchestrator.py` paper only |
| Compounding 10 col | `compounding_echelons.json` |

## 6. Interdits
- Signer avec PEM dans le front
- Bridge live sans bridge_health
- MoonPay webhook secret côté client
- Confondre wallet LIA ops et wallet utilisateur
