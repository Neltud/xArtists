# Vellum — Reconstruction / amélioration LIA (master)

> À coller / charger dans le prochain **run publish Vellum**.  
> Date: 2026-08-04 · Repo: Neltud/xArtists · Mainnet only

---

## 0. Flags non négociables

```
CHAIN=1
LIA_LIVE_TRADING=0          # jusqu’à micro-trades + signature OK
auto_execute=False           # Claude agent advisor-only
FEE_BPS=300
TRO_MAX_SUPPLY=500000        # jamais 1_000_000
```

PEM uniquement en **secret Vellum** (`LIA_WALLET_PEM` / path) — jamais loggé, jamais git.

---

## 1. Mission du prochain run Vellum

### Phase A — Deploy SC (P0 bloquant dApp market)

1. Build isolé `contracts/nft-marketplace` + `contracts/agents-marketplace`
2. Deploy mainnet (`scripts/deploy_mainnet.sh`) owner = **wallet LIA**
3. `post_deploy_contracts.py --marketplace erd1… --agents erd1…`
4. `verify_marketplace_codehash.py` → **codeHash non-null**
5. Commit `data/contracts.json` + push `main`
6. Rebuild Pages (`VITE_MARKETPLACE_ADDRESS`, `VITE_AGENTS_MARKETPLACE_ADDRESS`)

**Vérité on-chain actuelle (avant ce deploy)** : adresse marketplace historique = compte **vide** (codeHash null). Ne pas envoyer de fonds users dessus.

### Phase B — Publication données

```
python -m lia.board.publish          # si module dispo
python -m lia.gas.publish            # si module dispo
python -m lia.decisions.policy
python -m lia.gas.micro_trade
```

### Phase C — Claude advisor (nouveau)

Modules : `lia/claude_agent/`

| Module | Rôle |
|--------|------|
| `trade_lock.py` | Lock fichier partagé LIA ↔ Claude (anti double-sign) |
| `decision_engine.py` | Proposition JSON stricte, **jamais** de signature |
| `run_daily.py` | Cycle quotidien, `auto_execute=False` |
| `portfolio_allocator.py` | Poids winrate + reserve contrarian 4% + cap 60% |
| `hedged_momentum_strategy.py` | Signaux only — **pas** de capital réel sans backtest |
| `strategy_base.py` | Interface commune |

Contexte marché à injecter dans Claude : soldes LIA (API MVX), fear/greed, status board, gas estimates, GSN **en lecture seule** (≠ packs agents vendables).

### Phase D — Exécuteur LIA (P0 code)

- Brancher signature réelle **une seule** implémentation (partagée Claude `execute_fn`)
- Après lock + nonce frais gateway
- Micro-trades only + `should_skip_micro_trade`
- Toujours `LIA_LIVE_TRADING=0` jusqu’à validation humaine

---

## 2. Features dApp (référentiel produit)

| Zone | État cible |
|------|------------|
| Dashboard | Protocole LIA ≠ wallet user ; persona welcome |
| Studio | Mint parcours KPI #1 |
| Galerie | Marque **xArtists** only (pas de nom perso) |
| Market | List/Buy/Bid après SC + signature |
| Agents | Packs LIA ≠ GreenSmoke |
| $TRO | Cap **500 000** |
| DAO | Lecture seule jusqu’à TX prouvées |
| Portfolio / Trading | Board LIA paper |
| BottomNav mobile | Home · Studio · Market · $TRO · DAO · Wallet |

KPI rétention : **mint Studio → sell art → buy NFT → buy $TRO**.

---

## 3. Raisonnement LIA amélioré

1. **Gates** : policy risk + gas micro + live flag  
2. **Allocator** : TP1/TP3/TP5 + contrarian réservé 4% + floor exploration  
3. **Advisor Claude** : 1 proposition/jour, journal `data/claude_trading_proposals.json`  
4. **Lock** : un seul signer à la fois  
5. **GSN** : signaux externes, jamais amalgamés aux packs marketplace  
6. **Compound** : `compound_budget` après période paper validée  

HedgedMomentum : hypothèse sociale **non auditée** — paper/backtest only.

---

## 4. Post-deploy (humain ou Vellum)

Après adresses `erd1…` :

1. Update `contracts.json`  
2. VITE_* + Pages  
3. Retirer bandeaux « SC non déployé »  
4. Micro List/Buy user (extension / Web Wallet)  
5. Seulement alors discuter `LIA_LIVE_TRADING=1`  

---

## 5. Checklist run

- [ ] PEM secret chargé  
- [ ] Deploy nft + agents  
- [ ] codeHash non-null  
- [ ] contracts.json push  
- [ ] Pages rebuild  
- [ ] board/status timestamps frais  
- [ ] Claude cycle advisor-only journalisé  
- [ ] LIVE_TRADING reste 0  
