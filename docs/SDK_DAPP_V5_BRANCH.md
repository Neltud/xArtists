# Branche `feat/sdk-dapp-v5`

**But :** migrer le front vers `@multiversx/sdk-dapp` **v5.7+** et `sdk-core` **16.x** avant toute TX live.

**Réseau cible lecture :** MultiversX **mainnet** (Supernova epoch 2233+).  
**Fonds :** toujours **OFF** jusqu’à SC `codeHash` + `DEMO_MODE=false` explicite.

## Pourquoi une branche

| main (actuel) | feat/sdk-dapp-v5 |
|---------------|------------------|
| `sdk-dapp` ^3 | ^5.7 |
| `sdk-core` ^13 | ^16 |
| WalletContext custom + lecture | Providers officiels v5 |
| CI Pages stable paper | Build + tests migration |

## Étapes (ops / CI)

```bash
git fetch origin
git checkout feat/sdk-dapp-v5   # créée depuis main
cd apps/frontend
npm install @multiversx/sdk-dapp@^5.7 @multiversx/sdk-core@^16 --legacy-peer-deps
```

1. Suivre [docs sdk-dapp v5](https://docs.multiversx.com/sdk-and-tools/sdk-dapp/)
2. Remplacer init providers (extension / webwallet / WC)
3. Garder **interdiction** LIA ops wallet en `connect`
4. `TransactionWatcher` : timeouts adaptés rounds ~600 ms
5. CI : `npm run build` + smoke connect lecture mainnet
6. Merge **après** workflow vert — pas de `DEMO_MODE=false` dans ce merge

## Non-objectifs de la branche

- Deploy SC mainnet value
- Auto-trading LIA
- Breaking paper demo sur `main` avant validation

## Statut

- [x] Doc + branche créée
- [ ] npm install + rewrite wallet
- [ ] Workflow CI vert
- [ ] Review + merge
