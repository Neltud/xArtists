# ACTIVE_CONTEXT — xArtists (live system state)

**Last updated:** 2026-11-01  
**Branch:** `main`  
**Bundle:** `0.126.0` via `static.yml` · workflow `VITE_LIA_LIVE_TRADING` défaut **0** · Paybox UI fail-closed · **not** a trading go-live

---

## 1. On-chain status (probe 2026-11-01T05:48:00Z)

| Item | Value |
|------|--------|
| Epoch | **2280** · refreshRate **600** · rounds passed **78106** / 144000 |
| EGLD | **$3.44** · mcap **$106.92M** · circ 31.08M · staked 13.90M · APR **9.12%** |
| Supernova | LIVE depuis le 10 sept 2026 (epoch 2233) · **+47 epochs** |
| Agents SC | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| codeHash | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` (inchangé) |
| Agents balance | **0.013 EGLD** · non payable par SC |
| Pack prices | Pulse **10** / Yield **5** / Sentinel **2.5** EGLD |
| Market | `…8txmm` · **0.0175 EGLD** · hash inchangé · payable |
| Listing #1 / #2 | acheter **#2** seulement · le 0,25 EGLD est une preuve historique, pas un prix d’affichage |
| Slot | **0.5000 EGLD** · hash inchangé · `isPayable=false` · REAL fermé |
| LIA Ops | **0.907888 EGLD** · nonce **1487** |
| $TRO | `TRO-94c925` · circ **476,224** · **561** comptes · ~$0.00008223 · mcap ~$39.16 · **2815** tx |
| Treasury | dest **null** — ne pas `claimFees`. Balance 0. |

### Rupture du gel LIA Ops — 30 oct 17:20–17:29 UTC

Le probe du 30 oct 05:36 UTC disait nonce **1479** figé et solde **1.585598 EGLD**. Ce n’est plus vrai. Le même jour, le wallet `erd1p4zyy…qu0crn6` a signé **8 transactions** :

| Nonce | Heure UTC | Appel | Hash |
|------:|-----------|-------|------|
| 1479 | 17:20:15 | `xo` | `c13a93e6d12bdc76786008fa3854732fa17a3a31d1ee9c652f9fccc80a67abd2` |
| 1480 | 17:21:49 | `xo` (HTM) | `2203554da8705960c3f0cb857ee12f527cc469c589f8cab2f427dc870d475d77` |
| 1481 | 17:22:34 | `xo` (MEX) | `4a75d24dfa748364a24e60a62f63b711a658411189c5ddea591da3dde34765b2` |
| 1482 | 17:24:12 | `xo` (XOXNO) | `b43a431a274b24859a79549c29dc6d75610b9a8ab3880c967af95b5362274303` |
| 1483 | 17:25:18 | `xo` | `52a2539ca07cda7d7e2c474834fa2d977f4f2aba2fe311ba56f906d8e0436103` |
| 1484 | 17:27:02 | `removeLiquidity` TROMEX | `2f4db7e4d65e3730aa69c2e454f6cb69274736f07b1cae4bf647877b1e8b4d64` |
| 1485 | 17:27:27 | `composeTasks` | `3d4e3ffddc105bd059df49384078f30cbfd5d19e4b136c77ac49ae8e6325d109` |
| 1486 | 17:29:24 | `transfer` **7.09 EGLD** → owner $TRO `erd1mmh2j…ucj5l` | `8ad06a590619824325bf382bb48fb2e8de13368f8ad8bb39f5f3bda9e52c0a0a` |

Conséquence : **−0.68 EGLD** environ sur le hot wallet, plus la sortie de liquidité TROMEX. Ce n’est **pas** le client Pages. Ce n’est **pas** une autorisation de continuer. Ne pas recharger LIA Ops. Ne pas enchaîner un nouveau swap.

---

## 2. Revues coréennes (bloquant trading) — TOUJOURS EN FORCE

**Upbit** notice **207379109**, 23 oct 06:02 UTC : warning EGLD/KRW, EGLD/BTC, EGLD/USDT jusqu’au **16–20 nov 2026**. Aucun post `@Official_Upbit` de levée indexé au **1er nov 2026**.  
**Wallet Upbit** : dernier constat public **30 oct** — retraits seuls, dépôts bloqués, désignation **유의** toujours là. Non ré-observé le 1er nov. Reprise des retraits ≠ levée.  
**Bithumb** : warning EGLD + FET prolongé le 23 oct. Prochaine annonce EGLD **16–20 nov**. Fenêtre **FET 2–6 nov** (demain) **n’est pas** une levée EGLD.  
Notice INIT = autre actif.  
**Ne pas relancer de trade LIA Ops.** Phase code : `extended`. Au probe : **jour 9/29**, **15 j** avant le 16 nov, **20 j** avant le 21 nov 00:00 UTC.

EGLD **$3.44** n’est pas un signal d’exécution.

---

## 3. Security

| Finding | Status |
|---------|--------|
| Tickers mainnet XAIPLS / XAIYLD / XAISNT | résolu |
| Paper mint prod | DEV only |
| Paybox | UI **fail-closed** (`VITE_PAYBOX_ENABLED` défaut `false`). Rail Render = **preprod**. Ne pas passer `PAYBOX_ENV=prod`. |
| User-sign | `static.yml` : `VITE_LIA_LIVE_TRADING` défaut **0**. Une variable dépôt `=1` n’arme qu’xPortal + caps, pas un PEM, pas LIA Ops. |
| Gel clé LIA Ops | **rompu le 30 oct 17:29 UTC** au niveau du signataire. Le code Pages ne peut pas le refermer. Ne pas signer d’autres TX ops. |
| Prix fiat | catalogue serveur 110 / 75 / 50 €, wallet erd1 requis |
| Prix listing UI | pas de fallback inventé `0.25` |
| Snapshot entité | API live, repli = probe du **1er nov** |
| PR #200 `feat/orders-neon-store` | **non mergée**. Lockfile `access-api` cassé. |
| PR #221 release-please 0.126.0 | ouverte, **pas** ce probe. Ne pas la merger pour « faire le go-live ». |
| Bouton « Sign & broadcast » des proposals | **verrouillé**. |

---

## 4. Ce push

- `/go-live` reste explicite : **site = go-live**, **trading autonome = non**.
- Le repli ne sert plus le chrome du 30 oct (epoch 2278, EGLD $3.21, nonce 1479).
- Stamp **0.126.0**. `BUILD_ID.txt` était resté sur `0.124.0` : corrigé.
- `static.yml` : l’étape Pages revient à la racine du dépôt avant de copier `dist/` vers `_site/`. Sans ce `cd`, l’artifact pointait au mauvais chemin.
- Paybox défaut **false**. LIA défaut workflow **0**.

Voir [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md) et [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md).

---

## 5. Multi-IA roles

| Agent | Role | Scope |
|-------|------|--------|
| **Grok** | Dev / Ops | Code, workflows, probes, build Pages |
| **Gemini Flash** | Lead Architect / Audit | Revue architecture, cohérence |
| **LIA (Vellum)** | Trading & Curation | **suspendu** jusqu’à une notice de maintien. Le burst du 30 oct ne rouvre pas le mandat. |

## 6. Liens

- dApp: https://neltud.github.io/xArtists/
- GO_LIVE: https://neltud.github.io/xArtists/#/go-live
- Upbit notice: https://www.upbit.com/service_center/notice?id=207379109
- Transfert 7,09 EGLD: https://explorer.multiversx.com/transactions/8ad06a590619824325bf382bb48fb2e8de13368f8ad8bb39f5f3bda9e52c0a0a
- Repo: https://github.com/Neltud/xArtists
- Explorer agents: https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg
