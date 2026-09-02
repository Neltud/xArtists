# Audit entité xArtists — 2026-08-27

## Produit en ligne
- dApp : https://neltud.github.io/xArtists/
- Entité / succursales : `/entity`
- Sim Lab `/sim` · Intent ⌘K · Soul paper · LIA Monitor

## Données réelles (lectures)
| Source | Statut |
|--------|--------|
| api.multiversx.com/economics | Live (EGLD price, MC, APR) |
| LIA ops balance | Live ~0.069 EGLD (insuffisant deploy confortable) |
| data/*.json paper | Publiés ; rafraîchir via production_run |
| Marketplace codeHash | **null** |
| agents_marketplace | **null** |

## Maquette entité
`data/entity_map.json` + page `EntityMap` — 12 succursales avec status + évolution.

## Verdict publish main
**Oui** pour version démo complète en ligne (UI + lectures réseau + paper).  
**Non** pour commerce on-chain tant que SC non déployés.

## Prochaine action ops
1. `python -m lia.vellum.production_run` + push data  
2. Financer LIA ops ≥ 0.25 EGLD  
3. Deploy SC + verify codeHash  
