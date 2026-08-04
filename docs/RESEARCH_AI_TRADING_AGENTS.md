# Veille GitHub — agents IA trading (public) → LIA xArtists

> Synthèse 2026-08-04. **Aucune performance chiffrée de repo tiers n’est garantie** : la plupart des stars = popularité / framework, pas PnL audité mainnet.

## 1. Repos de référence (publics)

| Projet | Stars (ordre de grandeur) | Nature | Idée utile pour LIA |
|--------|---------------------------|--------|---------------------|
| [freqtrade/freqtrade](https://github.com/freqtrade/freqtrade) | ~40k | Bot crypto + backtest + FreqAI (ML adaptatif) | Hyperopt / retrain ; journal trades ; limits/day |
| [AI4Finance-Foundation/FinRL](https://github.com/AI4Finance-Foundation/FinRL) | ~16k | RL quant (PPO, SAC…) | Envs paper ; pas copier live sans backtest MVX |
| [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents) | ~9k+ | Multi-agents LLM (analyst / risk / trader) | Déjà proche : GSN + Claude advisor + fuse |
| [AI4Finance FinRobot](https://github.com/AI4Finance-Foundation/FinRobot) | élevé | Agents analyse financière LLM | Contexte marché structuré |
| [NautilusTrader](https://github.com/nautechsystems/nautilus_trader) | ~9k | Exécution haute perf + backtest | Qualité event-driven (pas HFT MVX) |
| [hummingbot](https://github.com/hummingbot/hummingbot) | élevé | MM / arb CEX-DEX | Micro-arb + inventory (proche MICRO_ARB) |
| chainstacklabs/web3-ai-trading-agent | tutoriel | Agent Uniswap V4 BASE | Pattern agent on-chain DEX |

**À ne pas traiter comme preuve de rendement** : bots meme-coin sniper, posts « $69k profit », claims sans ledger public.

## 2. Patterns à intégrer (sans copier de code propriétaire)

| Pattern open-source | Déjà dans xArtists | Amélioration concrète |
|---------------------|--------------------|------------------------|
| Multi-role LLM (TradingAgents) | `claude_agent` + GSN + modes | Ajouter un **risk agent** qui ne fait que veto (déjà DEFENSE) |
| FreqAI retrain | non | Journal paper + re-score allocator winrate |
| Freqtrade max trades / day | `guards` G06, `board/risk` | Aligner caps DEFENSE/MICRO_ARB |
| Hummingbot arb + fees | `micro_arb`, `should_skip_micro_trade` | Garder edge > fees×2.5 |
| FinRL paper envs | series paper, mode_orchestrator | 3 séries × $10 déjà prévu |
| Risk committee | `defense_circuit`, `CircuitGuards` | Continuer G01–G17 |
| Sentiment | `social_intel` | weight_cap 0.15 + rumor block |

**Ne pas importer** : exécution CEX HFT, snipers meme sans honeypot check, LLM qui signe sans lock.

## 3. Mapping modes LIA

```
TradingAgents risk team  → DEFENSE + CircuitGuards
Freqtrade strategy+ROI   → MOM / MR + compound TP curves
Hummingbot arb           → MICRO_ARB
FreqAI / FinRL           → paper only until backtest MVX data
Sentiment agents         → social_intel + GSN consumer
Advisor LLM              → claude_agent auto_execute=False
```

## 4. Rentabilité dApp xArtists (réel, pas trading alone)

Le trading LIA **n’est pas** le business model principal tant que `LIA_LIVE_TRADING=0` et capital faible.

### Sources de revenus alignées produit

| Source | Mécanisme repo | Priorité |
|--------|----------------|----------|
| **Fees marketplace NFT** | `FEE_BPS=300` (3 %) sur ventes | **P0** après deploy SC |
| **Fees agents marketplace** | même logique agents SC | **P0** après deploy |
| **Royalties créateurs** | Studio royalties % | P1 volume mint |
| **$TRO** | liquidité / gouvernance / incentives | P1 holders |
| **Packs agents LIA** | fulfillment API + badge | P1 post-SC |
| **Trading LIA** | paper → micro → live | **P2** après signature OK |

### Ce qui rend la dApp rentable

1. **GMV marketplace** (list/buy/bid) avec fee 3 %  
2. **Retention KPI** : Studio mint → sell → buy NFT → buy $TRO  
3. **Trust** : SC codeHash non-null, pas de faux Vote, wallets séparés  
4. Trading LIA = différenciation marketing + éventuel surplus protocole — **pas** le seul P&L

## 5. Priorités (ordre strict)

| # | Item | Pourquoi |
|---|------|----------|
| 1 | Deploy SC nft + agents + codeHash | Débloque fees réels |
| 2 | Signature user E2E | Achat/vente on-chain |
| 3 | Pages + index listings | UX conversion |
| 4 | Defense + modes + social (fait) | Protection capital LIA |
| 5 | Paper trading journal + allocator | Améliorer modèles sans risque |
| 6 | LIA_LIVE_TRADING=1 micro only | Après 1–5 |

## 6. Ce qui n’est pas important maintenant

- Copier un repo meme-sniper Solana  
- Promettre un winrate open-source  
- Multi-chain exécution Jupiter/HL live  
- Vote DAO TX  
- Soul zk mainnet funds  

---

*Veille qualitative ; stars GitHub ≠ alpha. Toute idée importée doit rester paper jusqu’à gates LIA.*
