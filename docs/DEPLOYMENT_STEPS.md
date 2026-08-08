# Étapes de déploiement — xArtists mainnet

**Réseau** : MultiversX **mainnet uniquement** (`CHAIN=1`)  
**Owner SC** : wallet LIA Ops  
**Fee** : `FEE_BPS=300` (3 %)  
**Trading live** : `LIA_LIVE_TRADING=0` jusqu’aux micro-trades OK  
**PEM** : jamais committer

Scripts : `scripts/deploy_mainnet.sh` · `simulate_deploy_mainnet.sh` · `sprint_a_mainnet.sh` · `post_deploy_contracts.py` · `verify_marketplace_codehash.py`

---

## Prérequis

| # | Check |
|---|--------|
| 1 | Compte **LIA** `erd1p4zyy…0crn6` avec **≥ 2–5 EGLD** (0,66 serré pour 2 deploys) |
| 2 | Fichier **PEM** local (`export PEM=/secure/mainnet.pem`) |
| 3 | Outils : `mxpy` / `sc-meta`, Python 3, Node (Pages) |
| 4 | Repo à jour : `git pull origin main` |
| 5 | `CHAIN=1` — **refuser** tout autre chain id |

```bash
export CHAIN=1
export PROXY=https://gateway.multiversx.com
export FEE_BPS=300
export LIA_LIVE_TRADING=0
export PEM=/path/to/mainnet.pem   # jamais dans git
```

---

## Étape 0 — Build isolé des SC

```bash
./scripts/build_scs_isolated.sh all
# ou
./scripts/build_scs_isolated.sh nft-marketplace
./scripts/build_scs_isolated.sh agents-marketplace
```

Vérifier la présence des `.wasm` sous `contracts/*/output/`.

---

## Étape 1 — Simulation (obligatoire avant envoi)

Estime `txGasUnits` / coût EGLD **sans** broadcast.

```bash
./scripts/simulate_deploy_mainnet.sh nft-marketplace
./scripts/simulate_deploy_mainnet.sh agents-marketplace

# ou via sprint A
RUN_SIMULATE=1 PEM="$PEM" ./scripts/sprint_a_mainnet.sh
```

| Résultat | Action |
|----------|--------|
| Simulation OK + solde ≥ coût × 1,2 | Continuer étape 2 |
| Solde insuffisant | Top-up LIA, **ne pas** déployer |
| Erreur wasm / init | Corriger code, rebuilder |

---

## Étape 2 — Deploy mainnet (irréversible)

```bash
# Un contrat à la fois (recommandé)
./scripts/deploy_mainnet.sh nft-marketplace
# → noter adresse erd1… affichée

./scripts/deploy_mainnet.sh agents-marketplace
# → noter adresse erd1…

# Ou les deux via sprint (après simulate OK)
RUN_DEPLOY=1 PEM="$PEM" ./scripts/sprint_a_mainnet.sh
```

**Ne pas** déployer le bridge BTC.  
**Ne pas** envoyer de NFT/fonds vers d’anciennes adresses `contracts.json` **vides**.

---

## Étape 3 — Post-deploy (contracts.json + VITE)

```bash
python scripts/post_deploy_contracts.py \
  --marketplace erd1..._NFT_MARKET \
  --agents erd1..._AGENTS_MARKET
```

Écrit :

- `data/contracts.json`
- `apps/frontend/.env.mainnet.example` (`VITE_MARKETPLACE_ADDRESS`, `VITE_AGENTS_MARKETPLACE_ADDRESS`, `VITE_AGENTS_FEE_BPS=300`)

```bash
git add data/contracts.json apps/frontend/.env.mainnet.example
git commit -m "chore: post-deploy mainnet SC addresses"
git push origin main
```

---

## Étape 4 — Vérifier codeHash (gate P0)

```bash
python scripts/verify_marketplace_codehash.py
```

| Verdict | |
|---------|--|
| `codeHash` **non-null** + code présent | OK — retirer bannières « SC non déployé » après Pages |
| `code=""` / `codeHash=null` | **Échec** — ne pas activer List/Buy ; re-déployer ou corriger adresse |

Comparer le hash on-chain au wasm local si le script le permet.

---

## Étape 5 — Blackbox micro (smoke)

Suivre `docs/MAINNET_DEPLOY_BLACKBOX.md` :

1. View `getFeeBps` → 300  
2. List NFT micro (wallet **user**, pas coller LIA)  
3. Buy micro  
4. Cancel / claimFees (owner) si endpoints présents  
5. Agents : list + buy pack test si catalogue prêt  

Documenter chaque **tx hash** explorer.

---

## Étape 6 — Frontend env + rebuild Pages

```bash
# CI / secrets Pages ou local build
export VITE_CHAIN_ID=1
export VITE_MARKETPLACE_ADDRESS=erd1...
export VITE_AGENTS_MARKETPLACE_ADDRESS=erd1...
export VITE_AGENTS_FEE_BPS=300

cd apps/frontend && npm ci && npm run build
# Push main → GitHub Actions Pages
# ou artifact vers branche gh-pages
```

Vérifier live :

- https://neltud.github.io/xArtists/  
- Market / Agents : **plus** de bannière « SC empty »  
- Fee 3 % visible avant Buy  

---

## Étape 7 — Signature wallet user

1. Connect **Web Wallet** ou extension (pas paste-only pour signer)  
2. **Jamais** le wallet LIA protocole en session user  
3. Micro List / Buy une fois codeHash OK  
4. Si échec signature → garder bandeaux, pas de faux succès  

---

## Étape 8 — Après go-live market (ops)

| Action | |
|--------|--|
| Premier `claimFees` owner | Split selon `docs/TREASURY_POLICY.md` ≤ 7 j |
| Mission + Reserve | Créer multisig, publier adresses |
| Index listings | Fin saisie manuelle ID |
| `LIA_LIVE_TRADING` | Reste **0** jusqu’à micro-trades trading prouvés |

---

## Erreurs fréquentes

Voir aussi `docs/DEPLOY_ERRORS.md`.

| Symptôme | Cause probable | Mitigation |
|----------|----------------|------------|
| `insufficient funds` | Solde LIA trop bas | Top-up 2–5 EGLD |
| `out of gas` | `GAS_LIMIT` trop bas | Relancer simulate → augmenter limit |
| codeHash null | Mauvaise adresse / compte vide | Ne pas pointer VITE vers old addr |
| User signe avec LIA | Session protocol | Header refuse LIA comme Connect |
| Pages stale | Cache Actions | Re-run workflow Pages |

---

## Checklist finale (cocher)

- [ ] Build wasm OK  
- [ ] Simulate OK  
- [ ] Deploy nft-marketplace → erd1…  
- [ ] Deploy agents-marketplace → erd1…  
- [ ] `post_deploy_contracts.py`  
- [ ] `verify_marketplace_codehash` → non-null  
- [ ] Commit `contracts.json`  
- [ ] `VITE_*` + rebuild Pages  
- [ ] Blackbox list/buy micro  
- [ ] `LIA_LIVE_TRADING=0`  

---

## Ordre one-liner (ops)

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0 PEM=/secure/mainnet.pem
./scripts/build_scs_isolated.sh all
./scripts/simulate_deploy_mainnet.sh nft-marketplace
./scripts/simulate_deploy_mainnet.sh agents-marketplace
./scripts/deploy_mainnet.sh nft-marketplace   # noter erd1
./scripts/deploy_mainnet.sh agents-marketplace
python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...
python scripts/verify_marketplace_codehash.py
# commit + Pages + blackbox
```

**Réf.** : `RUNBOOK_NOW.md` · `GO_LIVE_DEPLOY.md` · `MAINNET_DEPLOY_BLACKBOX.md` · `SECRETS_AND_DEPLOY.md` · `TREASURY_POLICY.md`
