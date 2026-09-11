# SDK & Supernova — état xArtists (2026-09-11)

## Réseau

| Item | Valeur |
|------|--------|
| Supernova mainnet | **Live** depuis ~10 sept 2026 |
| Epoch activation | **2233** |
| Round duration | **~600 ms** |
| Config | v2.0.6.0+ (hardening v2.0.7.0 nodes) |

Hub : https://supernova.multiversx.com/

## Frontend `package.json` (actuel)

| Package | Range repo | Latest npm (sept 2026) |
|---------|------------|-------------------------|
| `@multiversx/sdk-dapp` | `^3.0.0` | **5.7.x** |
| `@multiversx/sdk-core` | `^13.0.0` | **16.x** |
| `@multiversx/sdk-network-providers` | `^2.0.0` | **2.9.x** (OK zone) |

### Verdict

- **Lecture API / paper demo** : stack v3 **fonctionne** pour connect lecture + explorer.
- **Pas à jour** pour le standard officiel post–sdk-dapp **v5** (docs MultiversX).
- **Migration v5 = breaking** (providers, hooks, init). À faire **avant** TX live / mint, pas en urgence paper.

### Plan migration (P1 pré-mainnet fonds)

1. Branche `feat/sdk-dapp-v5`
2. `npm i @multiversx/sdk-dapp@^5 @multiversx/sdk-core@^16 --legacy-peer-deps`
3. Suivre [migration guide sdk-dapp v4→v5](https://docs.multiversx.com/sdk-and-tools/sdk-dapp/)
4. Re-tester : login extension / webwallet / WC, `TransactionWatcher` timeouts (600 ms rounds → confirmations plus rapides)
5. Ajuster `SUPERNOVA` timeouts watcher si besoin

### Ce qu’on ne fait **pas** maintenant

- Bump forcé v5 dans `main` sans rewrite wallet → casse le build CI Pages.
- Promettre gasless / auto-swap non déployés.

## Demo posture

- `DEMO_MODE=true`
- Bandeau : « Démo paper » + « Supernova · epoch 2233+ »
- SC product : toujours `codeHash null` → no fund risk
