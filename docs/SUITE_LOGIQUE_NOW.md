# Suite logique — 1 octobre 2026

## 0. Vérité

SC produit **live** (codeHash). LIA **paper**. House Slot **0.5 EGLD**.
Probe : epoch 2249 · EGLD $4.45 · LIA Ops 2.0932 EGLD.

## 1. Rebuild GH Pages

Push `main` → workflow Pages. Vérifier :
- Strip mainnet : Market SC **ouvert** (plus empty)
- `/go-live` : cases SC vertes via runtime explorer
- `/slot` : house > 0
- `/marketplace` : plus de copy « SC empty »

## 2. Preuve produit (1 TX user)

Ordre recommandé, micro montants :

1. Connect xPortal / Web Wallet (pas coller le wallet LIA)
2. Stake **1 TRO** → `tro_staking`
3. **ou** List 1 NFT dust → marketplace
4. **ou** spin Slot MODE REAL après FUN (house déjà fund)

Documenter tx hash dans `docs/ONCHAIN_MICRO_PROOFS.md`.

## 3. Vellum / LIA — rester paper

```bash
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m lia.vellum.production_run
```

Pas de live trading tant que Guardian + caps + kill-switch + 1 micro-trade.

## 4. MX-8004

Inscrire LIA (identity soulbound) — First 100. Ne pas promettre yield.

## 5. Ne pas faire

- Merger Dependabot majors (vite 8, eslint 10, vitest 4)
- Committer `VITE_*_CODEHASH_OK=1`
- Financer les placeholders `…8354t` / `…xr8cl` / `…e0ca8` / `…nyztkn`
- Coller le PEM
- Annoncer un fonds retail
