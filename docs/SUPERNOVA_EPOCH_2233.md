# Supernova — Mainnet Epoch 2233

**Source officielle** : MultiversX mainnet-config [v2.0.6.0](https://github.com/multiversx/mx-chain-mainnet-config/releases/tag/v2.0.6.0) + binaire [mx-chain-go v2.0.6](https://github.com/multiversx/mx-chain-go/releases/tag/v2.0.6).

| Paramètre | Valeur |
|-----------|--------|
| Config release | **v2.0.6.0** |
| Activation **epoch** | **2233** |
| Heure epoch (UTC) | **2026-09-10 17:45 UTC** |
| Activation **round** | **32 157 661** |
| Heure round (UTC) | **2026-09-10 ~18:05 UTC** |
| Objectif protocol | rounds ~**600 ms** (Supernova) |

## Impact xArtists

| Couche | Action |
|--------|--------|
| Demo paper / GH Pages | Banner info uniquement — pas de hard-stop |
| API publique | Surveiller latence gateway / indexer post-activation |
| sdk-dapp / TX | Re-tester connect + signature + TransactionWatcher **après** epoch 2233 |
| SC deploy | Possible avant/après ; prefer **post-upgrade validateurs >90%** |
| Guardian / LIA | Aucune TX auto pendant la fenêtre d’activation |

## Checklist post-activation (10 sept.)

1. [ ] Explorer mainnet répond (epoch ≥ 2233)
2. [ ] `gateway.multiversx.com` OK
3. [ ] WalletConnect + `@multiversx/sdk-dapp` : login / logout / 1 TX testnet ou micro-EGLD
4. [ ] Lecture `TRO-94c925` + NFTs collections OK
5. [ ] Pools xExchange TRO TVL lisibles
6. [ ] Si SC déjà déployés : `verify_marketplace_codehash` + views

## Compatibilité sdk-dapp (pré-check)

Frontend actuel (`apps/frontend/package.json`) :

- `@multiversx/sdk-dapp`: `^3.0.0`
- `@multiversx/sdk-core`: `^13.0.0`
- `@multiversx/sdk-network-providers`: `^2.0.0`

**Avant epoch 2233** : stack compatible mainnet actuel (API REST inchangée pour dApps).
**Après epoch 2233** : valider que les providers réseau et le watcher de TX restent stables (timeouts éventuellement plus courts grâce aux rounds 600 ms — ajuster `SUPERNOVA_TIMEOUTS` si besoin).

Voir aussi : `docs/SUPERNOVA_TIMEOUTS.md`, `docs/CONSOLIDATION_SUPERNOVA.md`.
