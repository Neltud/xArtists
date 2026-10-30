# ACTIVE_CONTEXT — xArtists (live system state)

**Last updated:** 2026-10-30  
**Branch:** `main`  
**Bundle:** `0.125.0` via `static.yml` · user-sign micro armed · Paybox UI fail-closed · **not** a trading go-live

---

## 1. On-chain status (probe 2026-10-30T05:36:00Z)

| Item | Value |
|------|--------|
| Epoch | **2278** · refreshRate **600** · rounds passed **78085** / 144000 |
| EGLD | **$3.21** · mcap **$99.73M** · circ 31.07M · staked 13.89M · APR **9.13%** |
| Supernova | LIVE depuis le 10 sept 2026 (epoch 2233) · **+45 epochs** |
| Agents SC | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| codeHash | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` (inchangé) |
| Agents balance | **0.013 EGLD** · non payable par SC |
| Pack prices | Pulse **10** / Yield **5** / Sentinel **2.5** EGLD |
| Market | `…8txmm` · **0.0175 EGLD** · hash inchangé · payable |
| Listing #1 / #2 | acheter **#2** seulement · le 0,25 EGLD est une preuve historique, pas un prix d’affichage |
| Slot | **0.5000 EGLD** · hash inchangé · `isPayable=false` · REAL fermé |
| LIA Ops | **1.585598 EGLD** · nonce **1479** (inchangé depuis le 17 oct) |
| $TRO | `TRO-94c925` · circ **476,224** · **561** comptes · ~$0.00007902 · mcap ~$37.63 · **2815** tx |
| Treasury | dest **null** — ne pas `claimFees`. Balance 0. |

Le 17 oct ~13:02 UTC le wallet LIA Ops a signé sur xExchange. Ce n’est **pas** le client Pages. Nonce figé.

---

## 2. Revues coréennes (bloquant trading) — TOUJOURS EN FORCE

**Upbit** notice **207379109**, 23 oct 06:02 UTC : warning EGLD/KRW, EGLD/BTC, EGLD/USDT jusqu’au **16–20 nov 2026**. Aucune notice de levée indexée au 30 oct 05:36 UTC.  
**Wallet Upbit** (page statut, 30 oct) : EGLD en **retraits seuls** (`출금가능`) avec mention **유의종목**. Les dépôts restent bloqués. Reprise des retraits ≠ levée du warning.  
**Bithumb** : warning EGLD + FET prolongé le 23 oct. Prochaine annonce EGLD alignée sur le **16–20 nov**. La fenêtre **FET 2–6 nov n’est pas une levée EGLD**.  
Notice INIT = autre actif.  
**Ne pas relancer de trade autonome LIA Ops.** Phase code : `extended`. Au probe : **jour 7/29**, **17 j** avant le 16 nov, **22 j** avant le 21 nov 00:00 UTC. Le client recalcule ces compteurs.

Le pair EGLD/USDT Upbit a imprimé un écart violent (carnet mince sous warning). Ce n’est pas un signal d’exécution.

---

## 3. Security

| Finding | Status |
|---------|--------|
| Tickers mainnet XAIPLS / XAIYLD / XAISNT | résolu |
| Paper mint prod | DEV only |
| Paybox | UI **fail-closed** (`VITE_PAYBOX_ENABLED` défaut `false`). Rail Render = **preprod**, A-E2E IPN encore ouvert. Ne pas passer `PAYBOX_ENV=prod`. |
| User-sign | `VITE_LIA_LIVE_TRADING` défaut **1** = xPortal + `userConfirmedLive` + caps 15/40 USD. Pas un PEM, pas LIA Ops. |
| Prix fiat | catalogue serveur 110 / 75 / 50 €, wallet erd1 requis |
| Prix listing UI | plus de fallback inventé `0.25` si `getListing` n’a pas de prix |
| Snapshot entité | API live, repli aligné sur le probe du 30 oct |
| PR #200 `feat/orders-neon-store` | **non mergée**. Lockfile `access-api` cassé. Hors chemin critique. |
| Bouton « Sign & broadcast » des proposals | **verrouillé**. Pas de signer sur cette page statique. |

---

## 4. Ce push

- `/go-live` reste explicite : **site = go-live**, **trading autonome = non**.
- Compte à rebours recalculé par le client. Au probe : jour **7/29**, **17 j** / **22 j**.
- Fallback `networkProbe` et JSON publics passent à l’epoch **2278** et EGLD **$3.21**. Hashes SC inchangés. LIA nonce inchangé.
- Stamp **0.125.0**.
- Paybox : le défaut workflow `true` est retiré. Une variable de dépôt peut encore l’ouvrir après preuve IPN.

Voir [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md) et [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md).

---

## 5. Multi-IA roles

| Agent | Role | Scope |
|-------|------|--------|
| **Grok** | Dev / Ops | Code, workflows, probes, build Pages |
| **Gemini Flash** | Lead Architect / Audit | Revue architecture, cohérence |
| **LIA (Vellum)** | Trading & Curation | Wallet ops, curation ATC→TCA — **pas** de nouveau live pendant la prolongation |

## 6. Liens

- dApp: https://neltud.github.io/xArtists/
- GO_LIVE: https://neltud.github.io/xArtists/#/go-live
- Upbit notice: https://www.upbit.com/service_center/notice?id=207379109
- Repo: https://github.com/Neltud/xArtists
- Explorer agents: https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg
