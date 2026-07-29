# 🪙 $TRO Token — Documentation d'Intégration Complète

> **Token ID :** `TRO-94c925`  
> **Ticker :** `$TRO`  
> **Réseau :** MultiversX Mainnet  
> **Décimales :** 18  
> **Standard :** ESDT (Elrond Standard Digital Token)  
> **Projet :** xArtists — Tuduri Original  
> **Artiste :** @tudurioriginal  

---

## 🎯 Vision

`$TRO` est le **Cœur de l'écosystème xArtists** — token utilitaire qui lie l'art physique à la blockchain MultiversX.

```
$TRO = Liquidité + Burn + Staking + Gouvernance DAO + Certificat d'authenticité RWA
```

**Triangle de valeur :**
- 🎨 **xArtists** (Corps) — Marketplace NFT, Galerie, Portfolio, dApp
- 🧠 **LIA v6** (Tête) — Agent IA autonome de trading, optimisation profits
- 🪙 **$TRO** (Cœur) — Token utilitaire, liquidité, burn, staking, gouvernance

---

## 📋 Spécifications Techniques

| Paramètre | Valeur |
|---|---|
| **Identifier** | `TRO-94c925` |
| **Ticker** | `TRO` |
| **Décimales** | `18` |
| **Standard** | ESDT (MultiversX) |
| **Réseau** | Mainnet (`chain_id = 1`) |
| **Explorer** | [explorer.multiversx.com/tokens/TRO-94c925](https://explorer.multiversx.com/tokens/TRO-94c925) |
| **Prix référence** | `AVG_ENTRY_TRO = 0.000097` USDC |

---

## 🔗 Smart Contracts Mainnet

| Contrat | Adresse | Statut |
|---|---|---|
| **NFT Staking** | `erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl` | 🔗 Déployé |
| **TRO Governance** | `erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8` | 🔗 Déployé |
| **Marketplace** | `erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t` | 🔗 Déployé |
| **NFT Minter** | `erd1qqqqqqqqqqqqqpgq00a2jzre64akaw4jx257gwwyfxxd8fzfyj7snyztkn` | 🔗 Déployé |

---

## 🏦 Utilités du Token $TRO

### 1. 🔒 Staking & Gouvernance DAO
```
Staker TRO → Voting Power proportionnel
Voting Power → Voter les proposals DAO
Proposals → Décider l'allocation liquidité LIA
```

**Paramètres DAO :**
- Quorum requis : **60%**
- Durée proposal : **24h** (7 epochs on-chain)
- Min stake pour voter : **1000 TRO**
- Unstake bloqué pendant proposals actives

**Paires candidates pour vote :**
| Paire | DEX | Risque | APR estimé |
|---|---|---|---|
| `TRO/USDC` | xExchange | FAIBLE | ~9% |
| `TRO/WEGLD` | xExchange | MOYEN | ~12% |
| `TRO/WBTC` | xExchange | ÉLEVÉ | Variable |
| `TRO/XOXNO` | XOXNO | ÉLEVÉ | Variable |

### 2. 🖼️ NFT Staking → Rewards $TRO
```
Staker NFTs xArtists → Recevoir $TRO en rewards
Collections éligibles : 11 collections mainnet
Rewards : automatiques, claimables via smart contract
```

**Collections éligibles :**
```
AGR-9bd53e    ALISTOR-a646bc  ASFT-a6273a
BGG-2b627c    HP47X2-b71543   MAS-5189b6
NFTUDURI-2990b6  XTR-e5072b  XAUS-d9cf1f
XAR-cee2e0    TRO-652d6d
```

### 3. 💰 Réinvestissement LIA v6 (50% profits)
```
LIA génère des profits de trading
→ 50% réinvestis en liquidité $TRO
→ Pool cible votée par les holders TRO
→ Augmente la TVL et la liquidité $TRO
```

### 4. 🏛️ Escrow RWA (Real World Assets)
```
Œuvres physiques Tuduri Original
→ Tokenisées via $TRO
→ Chaque NFT = certificat d'authenticité on-chain
```

### 5. 🔥 Burn Mechanism
```
Frais marketplace → Burn $TRO
Réduction supply → Pression haussière
```

---

## 🔍 Intégration LIA v6 (Vellum Workflows)

### Récupération du prix $TRO

LIA v6 utilise **3 sources en cascade** pour le prix $TRO :

```python
# Source 1 : Wallet tokens (cache ConnectWallet)
for token in all_tokens:
    if token["token_id"] == "TRO-94c925":
        tro_price = token["price_usd"]  # Prix API MultiversX

# Source 2 : xExchange /mex/pairs
GET https://api.multiversx.com/mex/pairs?size=500
→ Filtrer les paires avec TRO-94c925
→ Prendre le prix de la paire avec la TVL maximale

# Source 3 : /tokens/{id}
GET https://api.multiversx.com/tokens/TRO-94c925
→ Champ "price" (USD)

# Fallback : Variable d'environnement
AVG_ENTRY_TRO = 0.000097  # Prix d'entrée de référence
```

### Nœuds qui utilisent $TRO

| Nœud | Rôle |
|---|---|
| `XArtistsMonitor` | Surveillance balance, staking, rewards, prix |
| `TROLiquidityScanner` | Scan pools TRO sur xExchange, OneDex, JEXchange |
| `TRODaoVote` | Vote DAO pour allocation liquidité |
| `DAppDataAggregator` | Agrège données TRO pour la dApp |
| `FrontendBuilder` | Affiche prix, balance, TVL dans la dApp |
| `GitHubReporter` | Push métriques TRO vers GitHub Pages |
| `LIABrain` | Calcul ROI position TRO |
| `AvgEntryUpdater` | Prix live TRO depuis xExchange |
| `MCPConnector` | Pools TRO via API MultiversX |

### Encodage ESDT pour transactions

```python
# Identifier en hex UTF-8
tro_hex = "TRO-94c925".encode("utf-8").hex()
# = 54524f2d393463393235

# Montant avec 18 décimales
amount_raw = int(amount_tro * 10**18)
amount_hex = hex(amount_raw)[2:]  # sans '0x'

# Data field pour ESDTTransfer
data = f"ESDTTransfer@{tro_hex}@{amount_hex}@{function_hex}"
```

---

## 📊 Pools de Liquidité $TRO

### xExchange (Principal)
```
Paire TRO/WEGLD — Liquidité maximale
Paire TRO/USDC  — Stabilité, IL minimal
API : https://api.multiversx.com/mex/pairs?size=500
```

### OneDex
```
Contrat : erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc
Méthode : viewPair(pair_id) — scan itératif
```

### JEXchange
```
API : https://api.jexchange.io/pools
GitHub pools : https://github.com/jexchange-defi/jex-router-pools
```

---

## 🌐 Endpoints API MultiversX pour $TRO

```bash
# Prix et métadonnées
GET https://api.multiversx.com/tokens/TRO-94c925

# Holders
GET https://api.multiversx.com/tokens/TRO-94c925/accounts

# Transactions
GET https://api.multiversx.com/tokens/TRO-94c925/transactions

# Pools xExchange
GET https://api.multiversx.com/mex/pairs?size=500
# Filtrer : baseToken.identifier == "TRO-94c925"

# Balance wallet
GET https://api.multiversx.com/accounts/{wallet}/tokens/TRO-94c925
```

---

## 🔧 Variables d'Environnement

```bash
# Prix d'entrée de référence (fallback si API indisponible)
AVG_ENTRY_TRO=0.000097

# Wallet LIA (détient les TRO)
WALLET_ADDRESS=erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6

# Clé privée pour transactions TRO
MVX_PRIVATE_KEY=<votre_clé_privée>
```

---

## 🚀 Déploiement Mainnet — Checklist

- [x] Token `TRO-94c925` déployé sur mainnet
- [x] NFT Staking contract actif
- [x] TRO Governance contract actif
- [x] Marketplace contract actif
- [x] NFT Minter contract actif
- [x] 11 collections whitelistées dans NFT Staking
- [x] LIA v6 intégré (XArtistsMonitor, TROLiquidityScanner, TRODaoVote)
- [x] GitHub Pages dApp live
- [ ] Pools TRO/USDC et TRO/WEGLD avec liquidité initiale
- [ ] Première proposal DAO créée
- [ ] NFTs stakés dans le contrat

---

## 📈 Métriques Battle of Nodes

LIA v6 soumet automatiquement ces métriques $TRO au Battle of Nodes Supernova :

| Métrique | Source | Impact Score |
|---|---|---|
| NFT Staking actif | `XArtistsMonitor` | +15 pts |
| TRO Governance actif | `XArtistsMonitor` | +15 pts |
| NFTs stakés | `XArtistsMonitor` | +3 pts/NFT (max 15) |
| TRO stakés | `XArtistsMonitor` | +1 pt/1000 TRO |
| Proposals DAO actives | `TRODaoVote` | +10 pts |
| Balance TRO wallet | `ConnectWallet` | +5 pts |
| Agent LIA intégré | Automatique | +10 pts |

**Score maximum : 100/100**

---

## 🔗 Liens Utiles

| Ressource | URL |
|---|---|
| Explorer Token | https://explorer.multiversx.com/tokens/TRO-94c925 |
| dApp xArtists | https://neltud.github.io/xArtists |
| GitHub | https://github.com/Neltud/xArtists |
| xExchange | https://xexchange.com |
| Battle of Nodes | https://bon.multiversx.com |
| Artiste | https://twitter.com/tudurioriginal |

---

*Documentation générée par LIA v6 — Agent IA autonome xArtists*  
*Dernière mise à jour : 2026-07-23*