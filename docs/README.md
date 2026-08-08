# xArtists docs

## LIA / Trading

| Doc | Sujet |
|------|--------|
| [LIA_TRADING_ARCHITECTURE.md](LIA_TRADING_ARCHITECTURE.md) | **Carte modules + cycle Vellum unifié** |
| [LIA_SPLIT.md](LIA_SPLIT.md) | Splits TRO / PnL / fees / tips |
| [ORACLES.md](ORACLES.md) | Prix on-chain leaning |
| [TRO.md](TRO.md) | Token $TRO |

## Produit & treasury

| Doc | Sujet |
|------|--------|
| [TREASURY_POLICY.md](TREASURY_POLICY.md) | Fondation décentralisée |
| [DAPP_STATUS.md](DAPP_STATUS.md) | État dApp |

## Déploiement

| Doc | Sujet |
|------|--------|
| [RUNBOOK_DEPLOY.md](RUNBOOK_DEPLOY.md) | Deploy SC mainnet |
| [POST_DEPLOY_VERIFY.md](POST_DEPLOY_VERIFY.md) | Vérifs post-deploy |
| [REGRESSION.md](REGRESSION.md) | Tests |

## Commande cycle LIA

```bash
export LIA_LIVE_TRADING=0 CHAIN=1
python -m lia.vellum.pipeline
```
