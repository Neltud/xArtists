# ACTIVE_CONTEXT — xArtists (live system state)

**Last updated:** 2026-10-20  
**Branch:** `main`  
**Bundle:** `0.117.0` via `static.yml` · `VITE_LIA_LIVE_TRADING=0`

---

## 1. On-chain status (probe 2026-10-20 ~04:40 UTC)

| Item | Value |
|------|--------|
| Epoch | **2268** · refreshRate **600** |
| EGLD | **~$3.65** · mcap ~$113.1M · staked 14.27M · APR ~8.87% |
| Agents SC | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| codeHash | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` |
| Agents balance | **0.013 EGLD** (micro buyPack, pas des ventes 10/5/2.5) |
| Pack prices | Pulse **10** / Yield **5** / Sentinel **2.5** EGLD |
| Market | `…8txmm` · **0.0175 EGLD** · `isPayable=true` |
| Listing #1 | ASFT-a6273a nonce 1 · 0.25 EGLD · **inactif** |
| Listing #2 | même NFT · 0.25 EGLD · **actif** · bid locké **0.01** |
| Slot | **0.5000 EGLD** · `isPayable=false` · min bet **0.001** · REAL fermé |
| LIA Ops | **1.585598 EGLD** · nonce **1479** |
| $TRO | circ **476 224** · **562** comptes · ~$0.000083 · mcap ~$40 |
| Treasury dest | **null** — ne pas `claimFees` |

Le 17 oct ~13:02 UTC le wallet LIA Ops a signé sur xExchange : `wrapEgld` 0.11024, `addLiquidity` ×2, `swap`, `multiPairSwap`, `xo`. Ce n’est **pas** le client Pages. Le client reste paper tant que la fenêtre Upbit n’est pas close par une annonce de maintien.

---

## 2. Upbit (bloquant live)

Surveillance depuis le **21 sept 2026**. Décision annoncée **19–23 oct**. Au 20 oct matin UTC : EGLD **pas** dans les delist décidés (SOPH / ZIL = 16 nov). Dépôts/retraits encore décrits comme haltés. **Ne pas relancer de trade live.**

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

- Page `/go-live` : veille live (epoch, EGLD, LIA Ops, posture Upbit) lue sur l’API publique.
- `static.yml` stamp **0.117.0** pour que le site public ne reste pas collé au stamp 0.113.0.

Voir [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md) et [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md).

---

## 5. Multi-IA roles

| Agent | Role | Scope |
|-------|------|--------|
| **Grok** | Dev / Ops | Code, workflows, probes, build Pages |
| **Gemini Flash** | Lead Architect / Audit | Revue architecture, cohérence |
| **LIA (Vellum)** | Trading & Curation | Wallet ops, curation ATC→TCA — **pas** de nouveau live pendant Upbit |

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

