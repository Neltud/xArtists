# PROMPT VELLUM — Reconstruction complète LIA + dApp xArtists

> **Usage** : coller tel quel (ou par phases) dans le run / agent Vellum qui reconstruit LIA et publie.  
> **Source unique de vérité** : dépôt GitHub `Neltud/xArtists` (branche `main`).  
> **Règle** : n’invente aucune adresse, feature, endpoint ou performance absente du repo. Si absent → documente le *gap* et n’active pas en live.

**Live dApp** : https://neltud.github.io/xArtists/  
**Repo** : https://github.com/Neltud/xArtists  
**Réseau** : MultiversX **mainnet only** (`chainId` / `CHAIN=1`)

---

## A. Identité du système (repo)

| Élément | Valeur dans le repo |
|---------|---------------------|
| Produit | xArtists — AI + RWA + NFT sur MultiversX |
| Frontend | `apps/frontend` — React + Vite + TypeScript + Tailwind |
| Ops agent | `lia/` — Python modules (board, circuit, venues, executor, vellum, claude_agent, …) |
| SC | `contracts/` — dont `nft-marketplace`, `agents-marketplace` |
| Données runtime | `data/*.json` (contracts, board, gas, greensmoke, …) |
| Scripts deploy | `scripts/deploy_mainnet.sh`, `post_deploy_contracts.py`, `verify_marketplace_codehash.py` |
| Wallet protocole LIA (UI) | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` (`apps/frontend/src/config/links.ts` → `LIA_WALLET`) |
| Token | `TRO-94c925` — cap produit UI **500000** (docs / TroPage / DAO) |

**Séparation obligatoire**
- Wallet **LIA protocole** (ops, PEM secret Vellum) ≠ wallet **utilisateur** (Connect dApp).
- **Packs agents marketplace LIA** ≠ signaux **GreenSmoke** (`lia/agents/green_smoke_consumer.py` lit `data/greensmoke_top.json` ; UI Agents doit rester séparée).

---

## B. Flags non négociables (repo + décisions produit)

```
CHAIN=1
LIA_LIVE_TRADING=0
auto_execute=False          # lia/claude_agent/run_daily.py défaut
FEE_BPS=300
TRO_MAX_SUPPLY=500000
```

- PEM : **secret Vellum uniquement** — jamais commit, jamais log.
- Ne pas envoyer de fonds utilisateurs vers l’adresse marketplace tant que `codeHash` est null (voir `data/contracts.json`).

---

## C. Smart contracts — état réel dans `data/contracts.json`

| Clé | Adresse / valeur | Verdict repo |
|-----|------------------|--------------|
| `nft_staking` | `erd1qqqq…xr8cl` | listée mainnet |
| `tro_governance` | `erd1qqqq…e0ca8` | listée mainnet |
| `marketplace` | `erd1qqqq…j8354t` | **verification** : `codeHash: null`, `code_empty: true` → **NOT_DEPLOYED** (compte vide) |
| `nft_minter` | `erd1qqqq…nyztkn` | listée |
| `agents_marketplace` | `null` | **never deployed** |

**P0 Vellum** : déployer wasm `contracts/nft-marketplace` + `contracts/agents-marketplace` via `scripts/deploy_mainnet.sh` (ou `lia/vellum/deploy_scs_node.py` si utilisé dans le workflow), puis :

1. `python scripts/post_deploy_contracts.py --marketplace erd1… --agents erd1…`
2. `python scripts/verify_marketplace_codehash.py` → codeHash **non-null**
3. Mettre à jour `data/contracts.json` + env `VITE_MARKETPLACE_ADDRESS` / `VITE_AGENTS_MARKETPLACE_ADDRESS`
4. Push `main` + rebuild GitHub Pages

---

## D. Cartographie dApp frontend (routes réelles)

Source nav : `apps/frontend/src/config/links.ts` → `PRIMARY_NAV` + `SECONDARY_ROUTES`.

### PRIMARY_NAV

| Route | Label | Page source (indicatif) | Comportement attendu (repo) |
|-------|-------|-------------------------|-----------------------------|
| `/` | Dashboard | Dashboard | Stats **LIA protocole** (pas le wallet user) |
| `/studio` | Studio | ArtistStudio | Parcours mint 4 étapes ; pin IPFS manuel/Vellum ; **pas** mint auto SC tant que non branché |
| `/gallery` | Galerie | Gallery | Catalogue collections ; marque **xArtists** (pas nom perso en titre) |
| `/marketplace` | Market | Marketplace | List/Buy/Bid **dépendent** SC déployé + signature sdk-dapp |
| `/agents` | Agents | Agents | Packs LIA ; séparer GSN |
| `/trading` | Trading | Trading | Board / stratégies paper si JSON publié |
| `/portfolio` | Portfolio | Portfolio | Positions / scénarios |
| `/tro` | $TRO | TroPage | Cap 500000 ; swap lien xExchange |
| `/dao` | DAO | DAO | **Lecture seule** vote ; holders $TRO via API MVX |
| `/hatom` | Hatom | HatomPage | Positions / proxy wallet |
| `/lp` | LP | LPPoolsPage | LP / farms UI |
| `/wallet` | Wallet | Wallet | Connect utilisateur |
| `/tip` | Tip | Tip | Tips |

### SECONDARY_ROUTES

| Route | Note repo |
|-------|-----------|
| `/staking` | Staking |
| `/soul-testnet` | **experimental** — no mainnet funds |
| `/burnify` | shell UI only |

**Mobile** : `BottomNav` — Home, Studio, Market, $TRO, DAO, Wallet (KPI rétention : mint → sell → buy NFT → buy $TRO).

**Liens externes canoniques** (`LINKS`) : explorer, wallet.multiversx.com, xexchange, onedex, hatom, xoxno, greensmoke agents, TRO-94c925.

---

## E. Backend / intégrations (pas de serveur custom obligatoire)

| Couche | Rôle |
|--------|------|
| API MultiversX | Soldes, NFT counts, token TRO, holders |
| JSON GitHub Pages / `data/` | Board LIA, gas, status, greensmoke, contracts |
| SC mainnet | Staking, governance listés ; marketplace/agents à déployer |
| Pinata | `lia/media/pinata_connect.py`, `lia/media/storage.py` — JWT **secret** |
| Vellum | Orchestration `lia/vellum/*` |

---

## F. Modules LIA Python — inventaire repo (`lia/`)

### F.1 Circuit & stratégies (trading)

| Path | Rôle |
|------|------|
| `lia/circuit/strategies.py` | **MR** mean-reversion, **MOM** momentum+GSN, **ARB** micro-arb, **YIELD**, `fuse_signals` |
| `lia/circuit/strategies_venues.py` | Collecte core + venues, `fuse_all`, `inventory()` |
| `lia/circuit/tp_mode.py` | Modes take-profit |
| `lia/circuit/take_profit_curves.py` | Courbes TP |
| `lia/circuit/compound_engine.py` | Compound |
| `lia/circuit/guards.py` / `guarded_cycle.py` | Guards |
| `lia/circuit/autonomous_loop.py` | Boucle |
| `lia/circuit/vellum_cycle.py` | Cycle Vellum |
| `lia/circuit/verify_onchain.py` | Vérif on-chain |

**Règles `strategies.py` (ne pas altérer sans tests)**  
- MR : BUY si dev VWAP ≤ -1.2% et RSI≤35 ; SELL si dev ≥ +1.2% et RSI≥65 ; liq min 50k USD.  
- MOM : WAIT si `gs_regime == RISK_OFF` ; BUY si chg 1h/24h + volume spike + bias GSN bullish.  
- ARB : BUY si spread > fee_roundtrip × 2.5.  
- YIELD : si conf trade < 0.65 → YIELD USDC.  
- Fuse : SELL conf≥0.6 → best BUY (boost ARB) conf≥0.62 → YIELD → WAIT.

### F.2 Venues (`lia/venues/`)

Registre `registry.py` — **status exact** :

| id | chain | status | roles notables |
|----|-------|--------|----------------|
| xexchange | multiversx | partial | swap, lp, price, micro_arb |
| onedex | multiversx | partial | swap, lp, price, micro_arb |
| hatom | multiversx | partial | supply, borrow, yield |
| xoxno | multiversx | partial | nft_market |
| ashswap | multiversx | planned | stable_swap |
| jupiter | solana | planned | signals only jusqu’à adapter |
| raydium | solana | planned | |
| hyperliquid | hyperliquid | planned | perps/funding signals |
| soul | multi | experimental | future hooks |

`strategies_venues.inventory()` : executable_today ≈ xexchange, onedex, hatom_yield_signal ; signals_only ≈ jupiter, hyperliquid, soul.

### F.3 Board / risk / gas / policy

| Path | Rôle |
|------|------|
| `lia/board/publish.py` | Publier JSON board frontend |
| `lia/board/arb.py` | Scan arb block-time |
| `lia/board/series.py` | Séries paper |
| `lia/board/positions.py` | Positions |
| `lia/board/risk.py` | Risk board |
| `lia/gas/micro_trade.py` | `should_skip_micro_trade` |
| `lia/gas/mvx_gas.py` / `publish.py` | Gaz / publish |
| `lia/decisions/policy.py` | Gates décision |
| `lia/risk/trailing_stop.py` | Trailing (utilisé par GSN consumer) |
| `lia/agents/green_smoke_consumer.py` | Charge GSN, blend LIA, trailing |
| `lia/agents/mvx_agent.py` | Agent MVX |
| `lia/agents/fulfillment.py` | Fulfillment packs |
| `lia/executor/universal*.py` | Exécuteur (brancher signature réelle = P0) |
| `lia/media/*` | Pinata / storage / mxpy metadata |
| `lia/rewards/tro_creators.py` | Rewards créateurs $TRO |
| `lia/vellum/orchestrator.py`, `live_cycle.py`, `next_run.py`, `deploy_scs_node.py`, `publish_*` | Ops Vellum |

### F.4 Claude advisor (`lia/claude_agent/`)

| Module | Comportement repo |
|--------|-------------------|
| `decision_engine.py` | JSON strict BUY/SELL/HOLD/SKIP ; tokens EGLD,WBTC,WTAO,TRO,USDC ; **jamais** de signature |
| `run_daily.py` | `auto_execute=False` par défaut ; journal ; lock |
| `trade_lock.py` | Lock fichier anti double-sign LIA ↔ Claude |
| `portfolio_allocator.py` | Winrate weights ; reserve contrarian ; max_weight 60% ; exploration floor |
| `hedged_momentum_strategy.py` | **Signaux only** — doc repo : pas de capital sans backtest |

---

## G. Mission phases du run Vellum (ordre)

### Phase 0 — Préflight
- Lire `data/contracts.json`, `docs/VELLUM_LIA_RECONSTRUCTION.md`, ce fichier.
- Confirmer `LIA_LIVE_TRADING=0`.
- Secrets : PEM, PINATA_JWT si pin media.

### Phase A — Deploy SC (P0)
- Build + deploy nft-marketplace + agents-marketplace mainnet.
- post_deploy + verify codeHash.
- Commit contracts.json (sans PEM).

### Phase B — Publish data frontend
```text
python -m lia.board.publish
python -m lia.gas.publish
python -m lia.vellum.publish_data_for_frontend   # si présent dans le workflow
```
Timestamps des JSON **frais** (éviter board 404 / stale).

### Phase C — Cycle stratégies (paper)
1. Charger prix / VWAP / RSI / spreads xExchange vs OneDex (données API ou feeds repo).
2. `collect_core_signals` + `collect_venue_signals` + `fuse_all`.
3. Appliquer `GreenSmokeConsumer.blend_with_lia` si `data/greensmoke_top.json` existe.
4. Appliquer `lia.decisions.policy` + `should_skip_micro_trade`.
5. **Si** `LIA_LIVE_TRADING=0` : journaliser décision paper uniquement (pas de broadcast).
6. Publier board / status JSON.

### Phase D — Claude advisor (optionnel quotidien)
- Construire `market_context` string depuis : soldes API LIA wallet, fear/greed si dispo dans data, fused signal, gas, GSN bias (lecture).
- `run_daily_cycle(..., auto_execute=False)` → `data/claude_trading_proposals.json`.

### Phase E — Social / news intelligence (**à implémenter dans le repo**, pas inventer des sources fantômes)

Créer module proposé (s’il n’existe pas encore sous ce nom) :

`lia/signals/social_intel.py`

**Objectif** : produire un biais structuré consommable comme GSN (même shape logique : bias + confidence + weight max plafonné), **sans** exécuter de trade seul.

**Entrées autorisées (à brancher seulement si credentials secrets Vellum existent)**  
- X/Twitter API (comptes / listes configurés en secret — ne hardcoder aucun token).  
- Reddit API (subreddits configurables : ex. multiversx, crypto, defi — liste en config JSON `data/social_watchlist.json`).  
- Titres / résumés news **uniquement** via endpoints déjà utilisés ailleurs dans le repo ou secrets documentés — sinon skip.

**Sortie JSON** (exemple de schéma) :
```json
{
  "updated": "ISO-8601",
  "bias": "BUY|SELL|WAIT",
  "confidence": 0.0,
  "rumor_flag": false,
  "items": [{"source": "x|reddit|news", "summary": "…", "weight": 0.0}],
  "weight_cap": 0.15
}
```

**Règles de raisonnement (obligatoires)**  
1. **Rumeur** (`rumor_flag=true`) → ne peut **pas** pousser un BUY live ; max WAIT ou réduction de taille paper.  
2. Weight social total ≤ **0.15** (inférieur au `max_external_weight=0.3` de GSN dans `green_smoke_consumer.py`).  
3. Fusion : d’abord stratégies on-chain (`fuse_all`), puis GSN blend, puis social comme **dernier** modificateur de confiance (jamais override d’un SELL protecteur conf≥0.6).  
4. Journaliser dans `data/social_intel.json` + inclure un résumé dans le contexte Claude.  
5. Si API social indisponible → `bias=WAIT`, `n=0`, ne pas planter le cycle.

**Ce qui n’existe pas dans le repo aujourd’hui** : un scraper Twitter/Reddit production-ready. Le run doit **ajouter le module + tests unitaires** et rester paper tant que non validé.

### Phase F — Pages
- Rebuild frontend avec VITE_* après deploy SC.
- Vérifier routes PRIMARY_NAV + BottomNav.

---

## H. Meilleures stratégies (celles du repo — ordre d’exécution logique)

1. **Protective SELL** (MR overbought / fuse sells)  
2. **Micro-arb** xExchange ↔ OneDex si spread > 2.5× fees (`micro_arb` + `xexchange_onedex_arb`)  
3. **Mean-reversion** liquide EGLD/WBTC style  
4. **Momentum** seulement si pas RISK_OFF GSN  
5. **Hatom yield** si pas d’edge trade (`hatom_yield_signal` / `yield_first`)  
6. **Trailing** post-entrée via `DynamicTrailingStopManager`  
7. **Allocator** (`portfolio_allocator`) pour répartir budgets paper entre TP/stratégies  
8. **Claude** = 1 avis/jour structuré, non exécutant  
9. **Social intel** = biais faible, anti-rumeur  

**Hors scope live tant que status planned/experimental** : Jupiter exécution, Hyperliquid perps size, Soul zk mainnet funds.

---

## I. Interdits (éviter hallucinations)

- Ne pas affirmer que le marketplace SC est déployé tant que `data/contracts.json` dit `codeHash: null`.
- Ne pas fusionner GreenSmoke et packs agents payants.
- Ne pas mettre `LIA_LIVE_TRADING=1` sans micro-trades humains OK.
- Ne pas inventer d’ABI vote DAO TX tant que non dans le code frontend (DAO = read-only).
- Ne pas promettre de profits (hedged_momentum doc : claims sociaux non audités).
- Supply $TRO UI = **500000** max produit.
- Galerie branding = **xArtists** (pas de nom perso imposé en titre).

---

## J. Checklist fin de run (sortie machine-readable)

Écrire `data/vellum_run_report.json` :

```json
{
  "LIA_LIVE_TRADING": "0",
  "marketplace_address": null,
  "agents_marketplace_address": null,
  "marketplace_codeHash_non_null": false,
  "board_published": false,
  "gas_published": false,
  "claude_advisor_ran": false,
  "social_intel_ran": false,
  "fused_action": "WAIT",
  "errors": []
}
```

Remplir les champs réels après exécution.

---

## K. Commandes de référence (repo)

```bash
# Deploy (machine avec PEM)
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0 PEM=/secure/path.pem
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace
python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...
python scripts/verify_marketplace_codehash.py

# Publish
python -m lia.board.publish
python -m lia.gas.publish

# Claude advisor-only
# (inject call_claude + paths lock/journal — auto_execute=False)

# Inventory venues
python -m lia.circuit.strategies_venues
```

---

*Document généré pour Vellum à partir de l’arborescence et des fichiers lus du dépôt Neltud/xArtists. Toute extension (social_intel) doit être commitée dans le repo avant d’être traitée comme « existante ».*
