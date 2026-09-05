# Vellum — marche à suivre exhaustive (Build Cycle Run)

**Réseau :** MultiversX mainnet `CHAIN=1` · Proxy `https://gateway.multiversx.com`  
**Demo :** https://neltud.github.io/xArtists/  
**Repo :** https://github.com/Neltud/xArtists  
**Supernova :** epoch **2233** — 2026-09-10 17:45 UTC (`docs/SUPERNOVA_EPOCH_2233.md`)

> LIA = cerveau Vellum (service payant). Le **code produit** vit dans GitHub.  
> **Jamais** de PEM dans le frontend ni dans un commit.

---

## 0. Préflight (chaque run)

1. Confirmer secrets Vellum + GitHub :
   - `LIA_WALLET_PEM` (PEM complet, jamais loggé)
   - `LIA_CHAIN_ID=1`
   - `LIA_MVX_PROXY=https://gateway.multiversx.com`
   - `FEE_BPS=300`
   - `DEPLOY_CONTRACT=all` (ou ciblé)
2. Solde deployer : EGLD suffisant gas (wallet dédié, pas cold storage entier).
3. `LIA_LIVE_TRADING=0` tant que paper / soft launch.
4. Si date ≥ 10 sept 2026 17:45 UTC → cocher checklist Supernova avant TX lourdes.

---

## 1. Cycle Vellum « board / data » (paper — sûr)

Ordre strict (idempotent) :

| # | Commande | Sortie |
|---|----------|--------|
| 1 | `python -m lia.gas.publish` | `data/mvx_gas.json` |
| 2 | `python -m lia.board.publish` | `data/lia_board.json` |
| 3 | (opt) `python -c "from lia.venues.hatom import publish_hatom; publish_hatom()"` | hatom JSON |
| 4 | `python -c "from lia.media.storage import storage_status; ..."` | status média |
| 5 | `python -m lia.vellum.orchestrator` avec `LIA_LIVE_TRADING=0` | dry-run only |
| 6 | Commit + push `data/*.json` (+ `apps/frontend/public/data/` si miroir) | Pages live |

**Interdit en paper :** swap auto, mint SC non vérifié, claim fees, setTimeout fake-success.

---

## 2. Déployer les Smart Contracts (live)

### 2.A GitHub Actions (recommandé)

1. Repo **Settings → Secrets → Actions** : `LIA_WALLET_PEM`
2. **Actions → Deploy Smart Contracts → Run workflow**
3. **Devnet d’abord** : `chain=D`, `contract=all`, `fee_bps=300`, `commit_addresses=true`
4. Vérifier logs + `data/contracts.json`
5. Explorer devnet : codeHash non null
6. **Mainnet** : `chain=1`, mêmes inputs **seulement** si devnet OK + EGLD mainnet

Workflow : `.github/workflows/deploy-scs.yml`  
Node : `lia/vellum/deploy_scs_node.py`

### 2.B Depuis Vellum (même PEM)

```python
from lia.vellum.deploy_scs_node import run
print(run())  # lit LIA_WALLET_PEM, LIA_CHAIN_ID, FEE_BPS, DEPLOY_CONTRACT
```

Runner Vellum = image avec **repo + mxpy + Rust wasm** (ou wasm prébuild).

### 2.C Post-deploy (obligatoire)

```bash
python scripts/verify_marketplace_codehash.py   # exit 0
bash scripts/post_deploy_verify.sh --query-views
# ou
python scripts/post_deploy_verify.py
```

Puis seulement : activer flags Vite / `contracts.ts` adresses mainnet.

Contrats cibles typiques :

- `nft-marketplace`
- `agents-marketplace` (packs Pulse · Yield · Sentinel)
- (plus tard) staking / governance vote SC

---

## 3. Frontend (build + Pages)

```bash
cd apps/frontend
npm install --legacy-peer-deps
npm run build
```

CI : `.github/workflows/static.yml` (ou deploy-pages) — `working-directory: apps/frontend`, artifact `dist`.

Hard refresh demo : `Ctrl+Shift+R` → https://neltud.github.io/xArtists/

### sdk-dapp post-Supernova

1. Login wallet (xPortal / WC)
2. Lire balance EGLD + token TRO
3. TX micro-test (si non-demo) ou **simulation** signed payload
4. Si timeout TX : augmenter watcher / revoir `docs/SUPERNOVA_TIMEOUTS.md`

Packages épinglés paper : `sdk-dapp@^3`, `sdk-core@^13`.

---

## 4. Modules Empire (ordre de construction)

| Module | Priorité | État cible |
|--------|----------|------------|
| SC Marketplace multi-token | P0 | Deploy + verify codeHash |
| Agents packs (3 NFT) | P0 | Mint gated + metadata xAiAx/y/s |
| Guardian + no fake TX | P0 | Déjà policy front |
| LIA treasury ≥10 USDC | P1 | Policy paper → Guardian |
| Yield TRO/EGLD (DEX) | P1 | Staking page (pas DAO) |
| DAO LP vote power | P1 | Paper units |
| Oracle / Market page | P1 | Public indicators |
| Musée 3D surréaliste | P1 | WebGL + map links |
| Multiplayer lab | P2 | `/museum/lab` + Socket.IO opt-in |
| Auto-trading live | **BLOQUÉ** | Tant que `LIA_LIVE_TRADING=0` |
| WebXR casque | P3 | Post LIA Pass mint |

---

## 5. Prompt système Vellum (copier)

Voir **`docs/VELLUM_ASSISTANT_PROMPT.md`**. Compléments run :

- Packs IA affichés = **Pulse · Yield · Sentinel uniquement**
- Tours artistiques = service **CULTURE**, pas un pack
- Trading live **OFF** en demo
- Supernova epoch 2233 noté dans banner démo

---

## 6. ENV template (référence)

```bash
# Vellum / ops (JAMAIS dans le bundle Vite)
LIA_WALLET_PEM=<<PEM>>
LIA_CHAIN_ID=1
LIA_MVX_PROXY=https://gateway.multiversx.com
FEE_BPS=300
DEPLOY_CONTRACT=all
LIA_LIVE_TRADING=0

# Frontend (public)
VITE_WALLETCONNECT_PROJECT_ID=
VITE_MULTIPLAYER_URL=   # lab only
```

Fichier d’exemple : `apps/frontend/.env.vellum.example`

---

## 7. Definition of Done (un cycle)

- [ ] Data JSON publiés (board/gas)
- [ ] SC devnet OK **ou** mainnet verify codeHash
- [ ] `contracts.json` à jour sur main
- [ ] Frontend CI vert → Pages
- [ ] Aucun secret dans le diff
- [ ] Demo paper honnête (pas de claim live non déployé)
- [ ] Si post-10-sept : checklist Supernova cochée

---

## 8. Message type « prochain build cycle »

```
RUN VELLUM CYCLE
1) preflight secrets + LIA_LIVE_TRADING=0
2) lia.gas.publish + lia.board.publish
3) orchestrator dry-run
4) push data/*.json
5) (si GO SC) Actions deploy-scs chain=D puis verify
6) (si GO mainnet SC) chain=1 + verify_marketplace_codehash
7) frontend CI / hard refresh demo
8) noter epoch Supernova 2233 si fenêtre critique
```
