# Review lacunes xArtists — MAJ 2026-08-26

## Maturité

| Domaine | Maturité | Notes |
|---------|----------|-------|
| Front + parcours UX | **Élevée** | Journey, onboarding, Trading panels, ticker |
| Oracle | **Élevée** | pipeline + mirror |
| Compounding 10 col + annual | **Élevée** | v2 + UI |
| Signaux GSN/Poly/free/fusion | **Élevée** | ≥80% GSN · pretrade_gate |
| Vellum production_run | **Élevée** | signals + pretrade + mirror élargi |
| Guardian / gates | **Moyenne+** | live OFF |
| SC mint / market / agents | **Faible** | codeHash null — **P0** |
| Capital escrow SC | **Spec** | validator OK · UI Soon |
| Intel pay on-chain | **Catalog** | |
| RWA SC | **Spec** | |
| Live trading | **OFF** | correct |

## Résolu depuis 25 août
- Mirror CRITICAL : compounding, signal_ticker, fusion, intel catalog
- GSN seuil 80% + consumer aligné
- Polymarket + free feeds + fusion + ticker UI
- Pretrade gate + board signals snapshot
- UX parcours Home + Agents + onboarding 1ère visite
- Annual yield panel Trading

## P0 encore ouverts (bloquants produit on-chain)
1. Deploy **nft-marketplace** + **agents-marketplace** → codeHash ≠ null
2. Wallets Mission / Reserve / Reward / Ops publiés dans `contracts.json`
3. Micro-preuves on-chain avant tout flag live
4. `verify_marketplace_codehash.py` exit 0 avant VITE flags

## P1
5. Capital-escrow SC + Fund/Withdraw live
6. Settlement USDC intel marketplace
7. Executor paper appelle `apply_gate` à chaque leg (hook partiel)
8. Feed GSN live réel (au-delà seeds GitHub)
9. IPFS media packs 100%

## P2 / problèmes connus
10. `docs/STATUS.md` était périmé → rafraîchi
11. WalletConnect domain / Ledger UX polish
12. Multi-pay mint (EGLD/USDC/TRO)
13. Xmvx diffusion sociale
14. Risk: confusion user entre pack access et capital trading (mitigé copy + onboarding)
15. Risk: Polymarket API indispo → offline seed (OK fail-soft)

## Problèmes volontairement non « fixés »
- Live trading OFF — ne pas forcer
- Pas de faux List/Buy sans codeHash
- Pas de promesse de rendement (sim annuelle avec pertes)

## Ops
```bash
git pull
PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0 python -m lia.vellum.production_run
```
