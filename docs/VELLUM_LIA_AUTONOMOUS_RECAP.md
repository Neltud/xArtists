# LIA × Vellum — Récapitulatif autonome complet

> Ce que LIA doit **prendre en compte** et **faire toute seule** sur un run Vellum.  
> Rien ici n’autorise le live sans gates. **`LIA_LIVE_TRADING=0`** jusqu’à `docs/MICRO_PROOF.md`.

---

## 0. Principes non négociables

| Règle | Détail |
|-------|--------|
| Wallet LIA ≠ user | PEM ops protocole seulement ; jamais coller LIA comme session user |
| Claude = advisor | Propositions JSON, **pas** 2e exécuteur |
| Une seule main qui signe | LIA sous `trade_lock` + guards G01–G17 |
| Paper d’abord | Publish JSON board/oracle/brain même sans TX |
| Mainnet only | Pas de devnet dans les scripts deploy |
| Social cap | **0,15** ; rumor bloque BUY/ACCUMULATE |
| Pyramides fixes | 15/15/20/10/25/15 — pas de winrate sur les sleeves |

---

## 1. Boucle Vellum recommandée (ordre)

```text
1. Mémoire on-chain          python -m lia.memory.onchain_memory
2. Oracle prix               python -m lia.oracles.price_oracle
3. Social intel              SocialIntel().run() / feed JSON
4. SignalBus + GSN           lecture forecasts (pas exécution)
5. Defense check             defense_circuit / evaluate_defense
6. Mode + fuse               mode_orchestrator
7. Brain compound/yield      compound_yield_brain
8. Placement strategy        Hatom / xMEX / arb / idle
9. Pyramides can_trade       par sleeve + ashswap fees + micro_trade gas
10. Claude advisor (opt)     run_daily auto_execute=False
11. Publish board/status     lia.board.publish, gas.publish, oracle JSON
12. TX live (SI gates OK)    guarded_cycle mode=live UNIQUEMENT après MICRO_PROOF
```

Cadences types : board **1–5 min** · social **5–15 min** · xMEX compound **~7 j** · Claude advisor **1×/jour**.

---

## 2. Envois EGLD / flux trésorerie (autonome vs bloqué)

### 2.1 Ce que LIA **peut** planifier (paper → live sous proof)

| Destination | Action | Module / note |
|-------------|--------|----------------|
| **Gas ops** | garder min EGLD sur wallet LIA | guards G13, micro_trade |
| **Hatom** | supply / repay / claim (pas loop en DEFENSE) | `hatom_routes`, `hatom_loop_opt` |
| **xEx / OneDex / Ash** | swap / arb si edge > fees | `ashswap_fees`, MICRO_ARB sleeve |
| **xMEX weekly** | claim + lock (pas bridge) | `xmex_compound` |
| **Yield sleeve 30 %** | après wins compound | `compound_engine` split 70/30 |
| **NFT marketplace fee** | fee reste sur SC ; claimFees **owner LIA** | post-deploy `claimFees` |
| **Agents marketplace** | fee sur SC ; seller = LIA possible | fulfillment API+badge après buy |
| **$TRO rewards créateurs** | queue paper → live si pool + policy | `tro_creators`, trigger first_sale |

### 2.2 Staking NFT / gouvernance DAO — **état réel**

| Cible | Autonomie TX EGLD aujourd’hui | Attitude Vellum |
|-------|-------------------------------|-----------------|
| **DAO vote / stake $TRO** | UI **lecture seule** — pas de Vote faux | Ne **pas** envoyer EGLD “vote” tant que ABI + sdk-dapp + policy `risk_dao_vote` OK |
| **Staking page** | dépend SC staking déployé + adresses `contracts.json` | Si SC absent → **skip** + log ; pas d’EGLD vers adresse placeholder |
| **NFT stake / governance NFTs** | seulement si contrat listé, codeHash non-null, endpoint connu | Sinon paper intent only |

**Règle** : Vellum n’envoie des EGLD vers un contrat **que si**  
`(address in contracts.json) AND (codeHash verified OR explicit allowlist) AND (not defense halt) AND (LIA_LIVE_TRADING=1 OR amount=0 paper)`.

Placeholders `codeHash=null` → **interdiction** de transfer (évite brûler des fonds).

### 2.3 Circuit argent agents / NFT (rappel)

- Buy NFT/agent : **97 % seller / 3 % fee SC** (`FEE_BPS=300`)  
- claimFees : owner = **wallet LIA**  
- Burn $TRO : policy fees (pas inventer royalties agents)

---

## 3. Auto-learning + mémoire on-chain

| Entrée | Usage autonome |
|--------|----------------|
| `build_memory(wallet LIA)` | kinds swap/stake/claim, success_rate, cadence |
| `hours_since_last_swap` | gate pace (G05) |
| lessons brain | “too recent”, “idle long → yield”, “success_rate low” |
| `lia_compound_tickets.json` | historique wins/losses par ticket |
| pyramides `record_outcome` | compounds_done par sleeve |
| `lia_guards_state.json` | daily cap, halt, cooldown |
| oracle_prices.json | egld_usd pour gas gates |
| social_intel.json | blend post-fuse |

**Learning = mise à jour d’état + leçons heuristiques**, pas un second modèle qui signe.  
Ré-allocation sleeves : **fixe** (pyramides) ; winrate sert aux **choix intra-sleeve**, pas au % book.

---

## 4. Modes & défense (priorité)

1. DEFENSE → pas de nouveau BUY / pas leverage  
2. COMPOUND → gérer position ouverte (TP log/exp/ladder)  
3. MICRO_ARB → jusqu’à 40/j, edge après fees Ash/xEx/OneDex  
4. MOM / MR → caps jour  
5. YIELD → Hatom / idle  
6. SOCIAL_WATCH / ADVISOR → pas de TX

Triggers DEFENSE : RISK_OFF, fear≤25, DD≥12/15 %, HF&lt;1.5, loss streak, rumor soft.

---

## 5. Checklist run autonome “sain”

```bash
# Toujours (paper)
python -m lia.memory.onchain_memory          # ou size=50
python -m lia.oracles.price_oracle
python -m lia.circuit.mode_orchestrator
python -m lia.circuit.compound_yield_brain
python -m lia.defi.placement_strategy
python -m lia.circuit.compound_pyramids
# publish artifacts for Pages
python -m lia.board.publish   # si module présent

# Live TX — SEULEMENT si MICRO_PROOF + contracts codeHash
# PEM=... LIA_LIVE_TRADING=1  → guarded_cycle micro only
```

---

## 6. Ce que Vellum ne doit PAS faire seul

- Deploy SC sans runbook + solde explicite ops  
- EGLD vers adresse marketplace/agents **placeholder**  
- Vote DAO on-chain tant que UI read-only  
- Soul cross-chain lend / bridge user funds  
- `LIA_LIVE_TRADING=1` avant List/Buy user + micro LIA prouvés  
- Signer avec le wallet user  
- Exécuter les propositions Claude sans repasser guards LIA  

---

## 7. Objectifs business (contexte, pas des TX)

Autonomie LIA sert à : board fiable, yield/compound paper→micro, fees market **après** deploy SC.  
Rentabilité dApp = **GMV × 3 %** + agents + $TRO — pas le winrate open-source.

P0 ops reste : **deploy nft-marketplace + agents-marketplace + codeHash + VITE_* + Pages**.
