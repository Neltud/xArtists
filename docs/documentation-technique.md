---
description: >-
  L’index des documents de travail et des passations techniques xArtists, séparé
  de la présentation publique.
hidden: true
noIndex: true
---

# Documentation technique et passations

Cette page est destinée aux mainteneurs du projet. Les documents de travail peuvent décrire des hypothèses, des validations partielles ou des états historiques. Pour présenter xArtists à un visiteur, utiliser la [présentation publique](presentation/) et son [état de disponibilité](presentation/etat-du-produit.md).

### Passations et documentation technique

* [Passation GPT–Grok : dapp mobile](prompts/grok-dapp-mobile-2026-10-25/)
* [Reprise de la sortie officielle](prompts/grok-dapp-mobile-2026-10-25/sortie-officielle.md)
* [Correctif de retrait des modules abandonnés](prompts/grok-dapp-mobile-2026-10-25/retirer-polylia-greensmoke.md)
* [Ensemble de la documentation source]()

<details>

<summary>Ancien index de la page d’accueil — références conservées</summary>

### LIA / Trading

| Doc                                                                   | Sujet                                                                                              |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [VELLUM\_LIA\_WALLET\_DIRECTIVES.md](VELLUM_LIA_WALLET_DIRECTIVES.md) | **Directives Vellum : stratégies, LIA Wallet, MultiversX / PayBox et validation des ordres réels** |
| [LIA\_TRADING\_ARCHITECTURE.md](LIA_TRADING_ARCHITECTURE.md)          | **Carte modules + cycle Vellum unifié**                                                            |
| [LIA\_SPLIT.md](LIA_SPLIT.md)                                         | Splits TRO / PnL / fees / tips                                                                     |
| [ORACLES.md](ORACLES.md)                                              | Prix on-chain leaning                                                                              |
| [TRO.md](TRO.md)                                                      | Token $TRO                                                                                         |

### Produit & treasury

| Doc                                       | Sujet                   |
| ----------------------------------------- | ----------------------- |
| [TREASURY\_POLICY.md](TREASURY_POLICY.md) | Fondation décentralisée |
| [DAPP\_STATUS.md](DAPP_STATUS.md)         | État dApp               |

### Déploiement

Publication V3 : [V3\_PUBLICATION\_2026-10-21.md](V3_PUBLICATION_2026-10-21.md).

| Doc                                              | Sujet              |
| ------------------------------------------------ | ------------------ |
| [RUNBOOK\_DEPLOY.md](RUNBOOK_DEPLOY.md)          | Deploy SC mainnet  |
| [POST\_DEPLOY\_VERIFY.md](POST_DEPLOY_VERIFY.md) | Vérifs post-deploy |
| [REGRESSION.md](REGRESSION.md)                   | Tests              |

### Commande cycle LIA

```bash
export LIA_LIVE_TRADING=0 CHAIN=1
python -m lia.vellum.pipeline
```

</details>
