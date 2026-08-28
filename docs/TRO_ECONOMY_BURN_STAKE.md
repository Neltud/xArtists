# $TRO — Burn, staking, lien LIA (Pilier 3)

**Doctrine :** LIA exécute ; $TRO porte la valeur. Les frais LIA ne « corrompent » pas la logique Guardian.

## Proposition de mécanisme (spec — on-chain à activer)

### Burn

| Source de frais | % burn $TRO | Notes |
|-----------------|-------------|--------|
| Frais service pack (portion) | 20 % | Si collecte en $TRO |
| Fee tip marketplace (si TRO) | 10 % | Route burn address |
| Fee intent premium (pro) | 30 % | Option institutionnel |

Adresse burn / dead : **à publier** après déploiement SC (ne pas inventer d’adresse ici).

### Staking utilité

| Tier stake $TRO | Avantage LIA (product) |
|-----------------|------------------------|
| Bronze | Limite d’intents paper +|
| Silver | Accès quotes prioritaire / pack yield info |
| Gold | Caps commande plus hauts (quand live) + badge |

Implémentation UI actuelle : pages `/staking` · `/tro` (refs). SC rewards = pending deploy.

## Séparation stricte

- Un burn **ne désactive jamais** une règle Doctrine.
- Un stake **n’autorise pas** un bypass Guardian.
