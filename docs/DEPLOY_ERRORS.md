# Gestion des erreurs de déploiement — Mainnet

## Principes

1. **Simuler avant d’envoyer** : `./scripts/simulate_deploy_mainnet.sh`
2. **Ne jamais logger le PEM**
3. **Fail-fast** : build ou wasm manquant → stop (pas de faux ✅)
4. **Un contrat à la fois** en cas de doute : `agents-marketplace` puis `nft-marketplace`
5. **Relire l’explorer** : https://explorer.multiversx.com

---

## Erreurs fréquentes (mxpy / mainnet)

| Symptôme | Cause probable | Fix |
|----------|----------------|-----|
| `mxpy: command not found` | CLI absente | `pip install -U multiversx-sdk-cli` |
| `sc-meta` / build fail, rustc edition | Rust &lt; 1.78 | `rustup update` ; `cargo install multiversx-sc-meta --version 0.50.x` |
| `No wasm` / `output` vide | Build pas exécuté ou mauvais dossier | `cd contracts/&lt;name&gt; && sc-meta all build` |
| `insufficient funds` | Pas assez d’EGLD | Charger le wallet (~2 EGLD confort) |
| `nonce too low` / `too high` | Nonce désync | `--recall-nonce` (déjà dans les scripts) ; attendre txs pending |
| `gas limit exceeded` / out of gas | `GAS_LIMIT` trop bas (souvent 80M) | Simulate → `export GAS_LIMIT=txGasUnits*1.15` (max 600M) |
| `gasPrice below minimum` | Gas price custom trop bas | Laisser le défaut min mainnet (`1e9`) |
| `argument decode error` / bad init | `FEE_BPS` mal passé | `--arguments 300` (u16) ; pas de string |
| `contract already exists` | Rare (adresse dérivée) | Nouveau deploy = nouvelle adresse ; mettre à jour `contracts.json` |
| `invalid chainID` | Mauvais réseau | `CHAIN=1` + `PROXY=https://gateway.multiversx.com` |
| `signature` / PEM errors | Mauvais fichier PEM | Vérifier path ; jamais coller le PEM dans git |
| Timeout gateway | Réseau / charge | Retry après 30–60 s ; vérifier status tx par hash |
| Tx `success` mais adresse non parsée | Regex script | Copier l’adresse depuis le log / explorer manuellement |
| `upgrade` fail | Pas le codehash / pas owner chaîne | Nouveau deploy P0/P1 ; pas d’upgrade forcé sans policy |

---

## Codes / status MultiversX

| Status | Signification | Action |
|--------|---------------|--------|
| `success` | OK | Noter adresse SC + hash |
| `invalid` | Rejet (nonce, signature, gas price…) | Corriger et renvoyer **nouvelle** tx |
| `execution failed` | Panic SC / require failed dans `init` | Vérifier argument `fee_bps ≤ 1000` |
| Pending long | Congestion / gas | Attendre ; ne pas spam nonce |

`init(fee_bps)` échoue si `fee_bps > 1000` → toujours **300**.

---

## Matrice de récupération

```
Build fail          → fix toolchain → rebuild isolé
Simulate fail       → lire message → ajuster GAS / args
Send fail (funds)   → top-up EGLD → recall-nonce → resend
Send fail (gas)     → increase GAS_LIMIT → resend
Send OK, no address → explorer by tx hash → patch contracts.json
Partial deploy      → garder l’adresse OK ; redéployer seulement l’autre
Wrong fee_bps live  → setFeeBps(owner) si endpoint présent ; sinon nouveau deploy
```

---

## Checklist post-erreur

- [ ] PEM non exposé dans logs CI / Vellum
- [ ] Nonce à jour (`--recall-nonce`)
- [ ] Balance EGLD suffisante
- [ ] `GAS_LIMIT` ≥ data gas du wasm
- [ ] `CHAIN=1` uniquement
- [ ] `data/contracts.json` mis à jour **seulement** après succès confirmé explorer
- [ ] Frontend env pointant vers **nouvelles** adresses

---

## Vellum — comportement attendu

```text
On build failure: stop, report stderr (redact PEM)
On simulate failure: stop, report txSimulation status
On deploy failure: stop, do NOT write fake address to contracts.json
On success: write address + tx hash, then publish_data_for_frontend
Never retry infinite loops — max 2 retries on gateway timeout only
```

---

## Commandes utiles

```bash
# Balance
mxpy account get --address $(mxpy wallet pem --pem $PEM) --proxy https://gateway.multiversx.com

# Simulate only
./scripts/simulate_deploy_mainnet.sh agents-marketplace

# Deploy one contract with explicit gas
export GAS_LIMIT=250000000
./scripts/deploy_mainnet.sh agents-marketplace

# Tx status
curl -s "https://api.multiversx.com/transactions/<TX_HASH>" | jq .status
```
