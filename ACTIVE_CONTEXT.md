# ACTIVE_CONTEXT — xArtists (live system state)

**Last updated:** 2026-10-28  
**Branch:** `main`  
**Bundle:** `0.124.0` via `static.yml` · `VITE_LIA_LIVE_TRADING=0`

---

## 1. On-chain status (probe 2026-10-28T06:14:47Z)

| Item | Value |
|------|--------|
| Epoch | **2276** · refreshRate **600** · rounds passed **81955** / 144000 |
| EGLD | **$3.37** · mcap **$104.65M** · circ 31.05M · staked 13.88M · APR **9.15%** |
| Supernova | LIVE depuis le 10 sept 2026 (epoch 2233) · **+43 epochs** |
| Agents SC | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| codeHash | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` (inchangé) |
| Agents balance | **0.013 EGLD** · `isPayableBySmartContract=false` |
| Pack prices | Pulse **10** / Yield **5** / Sentinel **2.5** EGLD (non re-lus on-chain ce passage ; dernier `getPackPrice` officiel inchangé) |
| Market | `…8txmm` · **0.0175 EGLD** · hash inchangé · payable |
| Listing #1 / #2 | acheter **#2** seulement · le 0,25 EGLD est une preuve historique, pas un prix d’affichage |
| Slot | **0.5000 EGLD** · hash inchangé · `isPayable=false` · REAL fermé |
| LIA Ops | **1.585598 EGLD** · nonce **1479** (inchangé depuis le 17 oct) |
| $TRO | `TRO-94c925` · circ **476,224** · **562** comptes · ~$0.0000837 · mcap ~$39.88 · **2814** tx (+1 vs 27 oct, pas une preuve visiteur) |
| Treasury | dest **null** au dernier appel réussi — ne pas `claimFees`. Non réouvert dans ce passage. |

Le 17 oct ~13:02 UTC le wallet LIA Ops a signé sur xExchange. Ce n’est **pas** le client Pages. Nonce figé.

---

## 2. Revues coréennes (bloquant live) — TOUJOURS EN FORCE

**Upbit** notice **207379109**, 23 oct 06:02 UTC : warning EGLD/KRW, EGLD/BTC, EGLD/USDT jusqu’au **16–20 nov 2026**. Aucune notice de levée indexée au 28 oct 06:15 UTC.  
**Bithumb** : warning EGLD + FET prolongé le 23 oct. Prochaine annonce EGLD alignée sur le **16–20 nov**. La fenêtre **FET 2–6 nov n’est pas une levée EGLD**.  
Retraits EGLD Upbit interrompus le 21 oct 20:00 KST : pas de notice de reprise trouvée. Reprise des retraits ≠ levée du warning.  
Notice INIT (revue plus tardive) = autre actif.  
**Ne pas relancer de trade live.** Phase code : `extended`. Au probe : **jour 6/29**, **19 j** avant le 16 nov, **24 j** avant le 21 nov 00:00 UTC. Le client recalcule ces compteurs ; ils ne sont pas figés dans le bundle.

---

## 3. Security (inchangé, toujours en force)

| Finding | Status |
|---------|--------|
| Tickers mainnet XAIPLS / XAIYLD / XAISNT | résolu |
| Paper mint prod | DEV only |
| Paybox | **501** tant que `VITE_PAYBOX_ENABLED` n’est pas true **et** HMAC/IPN/mint prouvés. `static.yml` force `false`. |
| Prix fiat | catalogue serveur 110 / 75 / 50 €, wallet erd1 requis |
| Prix listing UI | plus de fallback inventé `0.25` si `getListing` n’a pas de prix |
| Snapshot entité | API live, repli aligné sur le probe du 28 oct (plus le 27) |
| PR #200 `feat/orders-neon-store` | **non mergée**. `mergeable_state=unstable`, base en retard, lockfile `access-api` vidé (~1200 lignes). `npm ci` casserait. Hors chemin critique. |

---

## 4. Ce push

- `/go-live` reste explicite : **site en lecture = go-live**, **trading = non**.
- Compte à rebours recalculé par le client. Au probe : jour **6/29**, **19 j** / **24 j**.
- Fallback `networkProbe` et JSON publics passent à l’epoch **2276** et EGLD **$3.37**. Hashes SC inchangés. LIA nonce inchangé.
- Stamp **0.124.0**. `VITE_LIA_LIVE_TRADING` reste **0**.

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
