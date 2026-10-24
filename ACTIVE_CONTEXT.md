# ACTIVE_CONTEXT — xArtists (live system state)

**Last updated:** 2026-10-24  
**Branch:** `main`  
**Bundle:** `0.120.0` via `static.yml` · `VITE_LIA_LIVE_TRADING=0`

---

## 1. On-chain status (probe 2026-10-24 ~04:40 UTC)

| Item | Value |
|------|--------|
| Epoch | **2272** · refreshRate **600** |
| EGLD | **~$3.46** · mcap ~$107.3M · staked 13.94M · APR ~9.06% |
| Agents SC | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| codeHash | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` |
| Agents balance | **0.013 EGLD** |
| Pack prices | Pulse **10** / Yield **5** / Sentinel **2.5** EGLD (`getPackPrice` ok) |
| Market | `…8txmm` · **0.0175 EGLD** · hash inchangé |
| Listing #1 / #2 | `getListing` répond encore · ASFT-a6273a nonce 1 · acheter **#2** seulement |
| Slot | **0.5000 EGLD** · hash inchangé · REAL fermé |
| LIA Ops | **1.585598 EGLD** · nonce **1479** (inchangé depuis le 17 oct) |
| $TRO | `TRO-94c925` · circ **476 224** · **562** comptes · ~$0.0000843 · mcap ~$40 |
| Treasury dest | **null** — ne pas `claimFees` |

Le 17 oct ~13:02 UTC le wallet LIA Ops a signé sur xExchange : `wrapEgld` 0.11024, `addLiquidity` ×2, `swap`, `multiPairSwap`, `xo`. Ce n’est **pas** le client Pages.

---

## 2. Revues coréennes (bloquant live) — PROLONGÉES

**Upbit** notice **207379109**, 23 oct 06:02 UTC : warning EGLD/KRW, EGLD/BTC, EGLD/USDT étendu jusqu’au **16–20 nov 2026**.  
**Bithumb** : warning EGLD + FET prolongé le 23 oct.  
Retraits Upbit interrompus le 21 oct 20:00 KST (upgrade réseau), pas encore une reprise.  
**Ne pas relancer de trade live.** Phase code : `extended`.

---

## 3. Security (inchangé, toujours en force)

| Finding | Status |
|---------|--------|
| Tickers mainnet XAIPLS / XAIYLD / XAISNT | résolu |
| Paper mint prod | DEV only |
| Paybox | **501** tant que `VITE_PAYBOX_ENABLED` n’est pas true **et** HMAC/IPN/mint prouvés |
| Prix fiat | catalogue serveur 110 / 75 / 50 €, wallet erd1 requis |
| Prix listing UI | plus de fallback inventé `0.25` si `getListing` n’a pas de prix |
| Pulse orphelin | corrigé — monté sur `/go-live` |

---

## 4. Ce push

- `/go-live` lit le pulse (agents, market, slot, $TRO, epoch, EGLD, LIA) **et** la prolongation KR. Le 24 oct n’est pas traité comme une fin de revue.
- Stamp **0.120.0**. `tests/kr-review.test.mjs` dans `test:release`.

Voir [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md) et [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md).

---

## 5. Multi-IA roles

| Agent | Role | Scope |
|-------|------|--------|
| **Grok** | Dev / Ops | Code, workflows, probes, build Pages |
| **Gemini Flash** | Lead Architect / Audit | Revue architecture, cohérence |
| **LIA (Vellum)** | Trading & Curation | Wallet ops, curation ATC→TCA — **pas** de nouveau live pendant la prolongation |

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
- Upbit notice: https://www.upbit.com/service_center/notice?id=207379109
- Repo: https://github.com/Neltud/xArtists
- Explorer agents: https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg
