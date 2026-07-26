# 📚 LIA v6 — Documentation Technique Complète

> **Dernière mise à jour :** 2026-07-23  
> **Version :** LIA v6 — Production Mainnet  
> **Réseau :** MultiversX Mainnet (Chain ID: 1)

---

## 🏗️ Architecture Globale

```
xArtists Ecosystem
├── 🧠 LIA (Vellum Workflows) — Agent trading autonome mainnet
│   ├── ConnectWallet → EnvBootstrap → [Données parallèles]
│   ├── BalanceGuard → OrchestratorRouter
│   ├── 5 Cerveaux IA → 6 Exécuteurs → DexFeesReporter
│   └── Reporters → GitHub Pages → Telegram
├── 🔮 Liia / Lia (GreenSmokeNetwork) — Agents prévisions
├── 📊 Macro (GreenSmokeNetwork) — Agent macro/info
└── 🎨 xArtists dApp — Frontend full-stack
```

---

## 🤖 Agents IA

| Agent | Plateforme | Rôle |
|---|---|---|
| **LIA** | Vellum Workflows | Trading autonome mainnet, yield, DAO |
| **Liia** | GreenSmokeNetwork | Prévisions / signaux |
| **Lia** | GreenSmokeNetwork | Prévisions / signaux |
| **Macro** | GreenSmokeNetwork | Analyse macro / info marché |

---

## 🔄 Workflow LIA v6 — 62 Nœuds Actifs

### Phase 1 — Connexion & Bootstrap
```
ToutesLes30Minutes (cron: 0 */1 * * *)
  └── ConnectWallet (API MultiversX mainnet)
        └── EnvBootstrap (détection ENV=PRODUCTION, Chain=1)
```

### Phase 2 — Collecte Données (Parallèle)
```
EnvBootstrap >>
  ├── DataHub >> ESDTScanner
  ├── XArtistsMonitor >> SupernovaDevnet
  ├── TRODaoVote >> TROLiquidityScanner
  ├── TradeLearner (VWAP on-chain)
  ├── HatomRedeemEGLD
  ├── MCPConnector
  ├── NonceManager
  ├── FeeOptimizer
  ├── EGLDRebalancer
  ├── AvgEntryUpdater
  ├── OpenClawIdentity
  └── SwapParamsValidator
```

### Phase 3 — Sécurité
```
BalanceGuard
  ├── OK → Cerveaux IA
  ├── WARNING → Cerveaux IA (mode dégradé)
  └── BLOCKED → AlertDispatcher → DexFeesReporter
```

### Phase 4 — Cerveaux IA (Parallèle)
```
├── LIABrain (WBTC/wTAO/EGLD — TP 15-25%)
├── UniversalBrainTP1 (scalping +1%, SL -0.5%)
├── UniversalBrainTP3 (swing court +3%, SL -1.5%)
├── UniversalBrainTP5 (swing moyen +5%, SL -2.5%)
└── ContrarianBrain (hedge contrarian)
```

### Phase 5 — Routing
```
OrchestratorRouter
  ├── TRADE → Exécuteurs
  ├── STRONG_BUY → Tous exécuteurs + HTMStaker
  ├── YIELD_ONLY → YieldOptimizer
  └── BLOCKED → AlertDispatcher
```

### Phase 6 — Exécution (Parallèle)
```
├── LIAExecutor (Hatom + xExchange 2-hop)
├── LIAExecutorTP1 / TP3 / TP5
├── ContrarianExecutor
└── SmartDexRouter (comparateur DEX)
```

### Phase 7 — Reporting (Parallèle)
```
DexFeesReporter >>
  ├── DAppDataAggregator >> FrontendBuilder >> GitHubDAppPublisher
  ├── DataValidator
  ├── ServiceDelivery >> TelegramNotifier >> PaymentMonitor
  ├── Reporter (Telegram)
  ├── SmartContractsReporter
  ├── ReinvestmentDecision >> ReinvestmentValidator
  ├── GitHubReporter
  └── BalanceTracker
```

---

## 🔗 Smart Contracts Mainnet

| Contrat | Adresse | Statut |
|---|---|---|
| NFT Staking | `erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl` | Déployé |
| TRO Governance | `erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8` | Déployé |
| Marketplace | `erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t` | Déployé |
| NFT Minter | `erd1qqqqqqqqqqqqqpgq00a2jzre64akaw4jx257gwwyfxxd8fzfyj7snyztkn` | Déployé |

---

## 🪙 Collections NFT Mainnet (11)

`AGR-9bd53e` · `ALISTOR-a646bc` · `ASFT-a6273a` · `BGG-2b627c` · `HP47X2-b71543`  
`MAS-5189b6` · `NFTUDURI-2990b6` · `XTR-e5072b` · `XAUS-d9cf1f` · `XAR-cee2e0` · `TRO-652d6d`

---

## 💰 Stratégies de Trading

| Stratégie | TP | SL | Budget | Tokens |
|---|---|---|---|---|
| TP1 Scalping | +1% | -0.5% | 32% | ESDT xExchange |
| TP3 Swing Court | +3% | -1.5% | 32% | ESDT xExchange |
| TP5 Swing Moyen | +5% | -2.5% | 32% | ESDT xExchange |
| LIABrain WBTC | +15% | -8% | 100% | WBTC-5349b3 |
| LIABrain wTAO | +20% | -10% | 100% | WTAO-a5c6ef |
| LIABrain EGLD | +25% | -12% | 100% | WEGLD-bd4d79 |
| Contrarian | +0.5% | -1% | 4% | Hedge |

---

## 🌾 Yield Passif (40% Portfolio)

- **Hatom** : Supply EGLD → 9-11% APR
- **xExchange EGLD/USDC** : ~9% APR, IL minimal
- **xExchange EGLD/MEX** : ~12% APR, MEX rewards
- **Auto-harvest** : quotidien si rewards > $0.10
- **Cascade** : B1 profits → 40% vers B2 → 30% vers B3

---

## 🗳️ DAO $TRO

- **Quorum** : 60% des TRO stakés
- **Durée** : 24h par proposal
- **Vote** : Allocation liquidité (TRO/USDC, TRO/WEGLD, TRO/WBTC, TRO/XOXNO)
- **LIA vote** : automatiquement selon stratégie `HIGHEST_TVL`

---

## 🌐 Configuration Réseau

```python
ENV = "production"  # Auto-détecté si MVX_PRIVATE_KEY présente
CHAIN_ID = "1"      # Mainnet
MVX_API = "https://api.multiversx.com"
MVX_GATEWAY = "https://gateway.multiversx.com"
WALLET = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"
```

---

## 🔐 Variables d'Environnement

| Variable | Rôle | Requis |
|---|---|---|
| `MVX_PRIVATE_KEY` | Signature TX on-chain | ✅ Production |
| `TELEGRAM_BOT_TOKEN` | Alertes Telegram | ✅ |
| `TELEGRAM_CHAT_ID` | Chat ID `1642853719` | ✅ |
| `AVG_ENTRY_EGLD` | Prix d'entrée EGLD | ✅ |
| `AVG_ENTRY_WBTC` | Prix d'entrée WBTC | ✅ |
| `AVG_ENTRY_WTAO` | Prix d'entrée wTAO | ✅ |
| `AVG_ENTRY_TRO` | Prix d'entrée TRO | ✅ |

---

## 📊 dApp xArtists — Pages

| Page | Contenu |
|---|---|
| **Dashboard** | Portfolio, prix temps réel, agents IA, BoN score |
| **Marketplace** | NFT listings, Escrow RWA, Market Making $TRO |
| **Trading Terminal** | Signaux LIA, analyse $TRO, exécution |
| **Portfolio** | Jalons $10→$1M, winrate, positions ouvertes |
| **DAO** | Voting on-chain, proposals, résultats |
| **Tip** | QR codes EGLD + BTC, GoFundMe, services |
| **Wallet** | Balances, Hatom, tous les tokens |

---

## 🎯 Objectif

**$3 → $1,000,000** via compounding DeFi autonome sur MultiversX mainnet.

- Artiste : Nelson Tuduri — @tudurioriginal
- Galerie : Saint-Maur-des-Fossés, Val-de-Marne
- GitHub Pages : https://neltud.github.io/xArtists
- Explorer : https://explorer.multiversx.com/accounts/erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6
