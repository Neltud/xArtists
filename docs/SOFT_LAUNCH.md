# Soft launch xArtists (paper-first)

**Décision produit :** A public maintenant · B ops SC en parallèle · C musée mur/zoom/intent sans fake buy.

## A — Surface publique (GO_DEMO)

- Banner : `SOFT LAUNCH · PAPER` (`apps/frontend/src/config/demoMode.ts`)
- Parcours critique : Accueil → Wallet → Musée → Tours → Packs (`SoftLaunchPath`)
- Trading LIA live **OFF**
- Packs : Pulse · Yield · Sentinel
- Tours = culture, pas pack agent
- Aucune promesse gasless / swap auto non déployé

## B — SC (ops, hors git secrets)

```bash
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
# dry-run
export VELLUM_DEPLOY_DRY=1 VELLUM_DEPLOY_SCS=1
# PEM uniquement vault Vellum
./scripts/runbook_deploy.sh dry
# puis deploy + verify — seulement après :
# VITE_MARKETPLACE_CODEHASH_OK=1  (build) si codeHash vérifié
```

UI reste **fail-closed** via `canListBuyNft()` / `canBuyAgent()` tant que flags absents.

## C — Musée

- Mur + cadre + zoom (±, clic)
- CTA **Intention d’achat** → event `lia-intent` paper / Guardian
- Si SC live + flag : parcours signature wallet (pas de SUCCESS simulé)

## QA soft launch (5 min)

1. Hard refresh Pages
2. Banner PAPER visible
3. Connect wallet (ou paste readonly)
4. Wallet → My NFTs / tokens
5. Musée → zoom œuvre → Intention d’achat (message paper)
6. Tours carte
7. Packs agents
8. Marketplace : pas de buy live si codeHash null
