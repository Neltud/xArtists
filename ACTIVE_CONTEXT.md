# ACTIVE_CONTEXT — xArtists (live system state)

**Last updated:** 2026-10-21  
**Branch:** `main`  
**Bundle:** `0.118.0` via `static.yml` · `VITE_LIA_LIVE_TRADING=0`

---

## 1. On-chain status (probe 2026-10-21 ~04:35 UTC)

| Item | Value |
|------|--------|
| Epoch | **2269** · refreshRate **600** |
| EGLD | **~$3.73** · mcap ~$115.6M · staked 14.27M · APR ~8.86% |
| Agents SC | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| codeHash | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` |
| Agents balance | **0.013 EGLD** |
| Pack prices | Pulse **10** / Yield **5** / Sentinel **2.5** EGLD (`getPackPrice` ok) |
| Market | `…8txmm` · **0.0175 EGLD** · `isPayable=true` |
| Listing #1 | ASFT-a6273a nonce 1 · 0.25 EGLD · **inactif** |
| Listing #2 | même NFT · 0.25 EGLD · **actif** · bid locké **0.01** |
| Slot | **0.5000 EGLD** · `isPayable=false` · min bet **0.001** · REAL fermé |
| LIA Ops | **1.585598 EGLD** · nonce **1479** (inchangé depuis le 17 oct) |
| $TRO | `TRO-94c925` · circ **476 224** · **562** comptes · ~$0.000084 · mcap ~$40 |
| Treasury dest | **null** — ne pas `claimFees` |

Le 17 oct ~13:02 UTC le wallet LIA Ops a signé sur xExchange : `wrapEgld` 0.11024, `addLiquidity` ×2, `swap`, `multiPairSwap`, `xo`. Ce n’est **pas** le client Pages.

---

## 2. Revues coréennes (bloquant live)

**Upbit** depuis le 21 sept. **Bithumb** a calé la même fenêtre **19–23 oct** (article 18 oct). Au 21 oct ~04:35 UTC : EGLD toujours en warning, **pas** dans les delist décidés (SOPH / ZIL = 16 nov). **Ne pas relancer de trade live.**

---

## 3. Security (inchangé, toujours en force)

| Finding | Status |
|---------|--------|
| Tickers mainnet XAIPLS / XAIYLD / XAISNT | résolu |
| Paper mint prod | DEV only |
| Paybox | **501** tant que `VITE_PAYBOX_ENABLED` n’est pas true **et** HMAC/IPN/mint prouvés |
| Prix fiat | catalogue serveur 110 / 75 / 50 €, wallet erd1 requis |
| Prix listing UI | plus de fallback inventé `0.25` si `getListing` n’a pas de prix |

---

## 4. Ce push

- `/go-live` lit agents, market, slot et `$TRO` en plus d’epoch / EGLD / LIA. Le jour de fenêtre est calculé (jour 3 le 21 oct).
- Stamp **0.118.0**. Package frontend sorti de 0.113.0.

Voir [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md) et [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md).

---

## 5. Multi-IA roles

| Agent | Role | Scope |
|-------|------|--------|
| **Grok** | Dev / Ops | Code, workflows, probes, build Pages |
| **Gemini Flash** | Lead Architect / Audit | Revue architecture, cohérence |
| **LIA (Vellum)** | Trading & Curation | Wallet ops, curation ATC→TCA — **pas** de nouveau live pendant la revue |

## 6. RAG

- Source: `knowledge/rag/atc_transcripts/`
- Curation: `knowledge/rag/lia_curation/`
- Workflow: `.github/workflows/rag-ingestion.yml`

## 7. Prix packs

- Workflow manuel: `.github/workflows/update-pack-prices.yml`
- `setPackPrice` `0x01|0x02|0x03` — officiels **10 / 5 / 2.5** EGLD
- Recettes → owner SC → financement Vellum, pas un fonds retail

## 8. Liens

- dApp: https://neltud.github.io/xArtists/
- GO_LIVE: https://neltud.github.io/xArtists/#/go-live
- Repo: https://github.com/Neltud/xArtists
- Explorer agents: https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg
