# 🎨 xArtists — Tuduri Original

> **Agent IA LIA v5** réinvestit les profits de trading DeFi dans l'écosystème xArtists sur MultiversX.

[![Live dApp](https://img.shields.io/badge/dApp-Live-23f7dd?style=for-the-badge)](https://neltud.github.io/xArtists)
[![MultiversX](https://img.shields.io/badge/MultiversX-Mainnet-4d9fff?style=for-the-badge)](https://multiversx.com)
[![Battle of Nodes](https://img.shields.io/badge/Battle_of_Nodes-Supernova-a855f7?style=for-the-badge)](https://bon.multiversx.com)

---

## 🌐 dApp Live

**https://neltud.github.io/xArtists**

Dashboard temps réel : portfolio LIA, score Battle of Nodes, 11 collections NFT, staking, governance TRO.

---

## 🏗️ Architecture

```
xArtists/
├── docs/                    # GitHub Pages — dApp frontend
│   ├── index.html           # Dashboard complet style MultiversX
│   └── .nojekyll
├── data/                    # Données live pushées par LIA v5 (auto)
│   ├── lia_v5_status.json   # Portfolio, prix, décision LIA
│   ├── xartists_onchain.json # NFTs, TRO, staking, BoN score
│   └── battle_of_nodes.json # Score Battle of Nodes Supernova
├── xArtists-master/         # Smart contracts Rust (MultiversX)
│   ├── nft-staking/         # Contrat NFT Staking
│   ├── tro-staking/         # Contrat TRO Governance
│   ├── demo-only/           # Contrats demo (faucet, escrow, minter)
│   ├── deploy.sh            # Script de déploiement
│   └── utils.sh
└── README_LIA.md            # Dashboard LIA v5 (généré automatiquement)
```

---

## ⚔️ Battle of Nodes — MultiversX Supernova

| Critère | Points | Statut |
|---|---|---|
| NFT Staking contract actif | +15 | 🔗 Mainnet |
| TRO Governance contract actif | +15 | 🔗 Mainnet |
| NFTs stakés | +3/NFT (max 15) | ⏳ |
| TRO verrouillé | +1/1000 TRO (max 10) | ⏳ |
| 11 collections mainnet | +11 | ✅ |
| DAO proposals actives | +10 | ⏳ |
| Portfolio xArtists > $10 | +5 | ⏳ |
| TRO en circulation | +5 | ⏳ |
| **LIA v5 AI Agent** | **+10** | ✅ |

---

## 🔗 Smart Contracts Mainnet

| Contrat | Adresse |
|---|---|
| **NFT Staking** | `erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl` |
| **TRO Governance** | `erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8` |
| **Marketplace** | `erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t` |
| **NFT Minter** | `erd1qqqqqqqqqqqqqpgq00a2jzre64akaw4jx257gwwyfxxd8fzfyj7snyztkn` |
| **Wallet LIA** | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` |

---

## 🖼️ Collections NFT Mainnet (11)

| Collection | Ticker | Explorer |
|---|---|---|
| Agreste | `AGR-9bd53e` | [↗](https://explorer.multiversx.com/collections/AGR-9bd53e) |
| Alistor | `ALISTOR-a646bc` | [↗](https://explorer.multiversx.com/collections/ALISTOR-a646bc) |
| xArtists SFT | `ASFT-a6273a` | [↗](https://explorer.multiversx.com/collections/ASFT-a6273a) |
| Bgg | `BGG-2b627c` | [↗](https://explorer.multiversx.com/collections/BGG-2b627c) |
| HP47X2 | `HP47X2-b71543` | [↗](https://explorer.multiversx.com/collections/HP47X2-b71543) |
| Mas | `MAS-5189b6` | [↗](https://explorer.multiversx.com/collections/MAS-5189b6) |
| NFTuduri | `NFTUDURI-2990b6` | [↗](https://explorer.multiversx.com/collections/NFTUDURI-2990b6) |
| XTR | `XTR-e5072b` | [↗](https://explorer.multiversx.com/collections/XTR-e5072b) |
| XAUS | `XAUS-d9cf1f` | [↗](https://explorer.multiversx.com/collections/XAUS-d9cf1f) |
| XAR | `XAR-cee2e0` | [↗](https://explorer.multiversx.com/collections/XAR-cee2e0) |
| TRO NFT | `TRO-652d6d` | [↗](https://explorer.multiversx.com/collections/TRO-652d6d) |

**Token $TRO mainnet :** `TRO-a3d7c5`

---

## 🤖 LIA v5 — AI Trading Agent

LIA (Liquidity Intelligence Agent) est un agent IA autonome de trading DeFi sur MultiversX, développé sur **Vellum Workflows**.

- **Objectif :** $3 → $1,000,000 via compounding DeFi
- **Stratégies :** TP1/TP3/TP5 scalping + LIABrain + Contrarian + Yield 40%
- **DEX :** xExchange, AshSwap, XOXNO
- **DeFi :** Hatom (lending), xExchange farms
- **Cycle :** Toutes les heures (cron `0 */1 * * *`)
- **Reporting :** Telegram + GitHub Pages (ce repo)

---

## 👨‍🎨 À propos

**Nelson Tuduri** — Artiste peintre, fondateur de xArtists  
Atelier Expositions Nelson Tuduri · 91bis avenue du Bac, Saint-Maur-des-Fossés  
Twitter: [@tudurioriginal](https://twitter.com/tudurioriginal)

---

*Données générées automatiquement par LIA v5 — MultiversX Mainnet*