# Analyse DApp Complète xArtists — 24 septembre 2026

## Résumé exécutif

xArtists est une dApp **MultiversX mainnet** (lecture) : galerie NFT / phygital, marketplace fail-closed, $TRO (cap 500 000), DAO lecture, LIA v6 paper-first, Primordial Slot paper.

| | |
|---|---|
| **Live Pages** | https://neltud.github.io/xArtists/ |
| **Tour démo** | https://neltud.github.io/xArtists/#/demo |
| **GO_LIVE checklist** | https://neltud.github.io/xArtists/#/go-live |
| **Slot paper** | https://neltud.github.io/xArtists/#/slot |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_DEMO** — pas un marché live |
| **LIA** | `LIA_LIVE_TRADING=0` |
| **SC produit** | **codeHash non vérifiable aujourd’hui** (accounts API down) — last-known **null** (19 Sep) |
| **Supernova** | LIVE 10 sept 2026 · epoch 2233 · probe epoch **2242** · 600 ms **J+9** |
| **LIA Ops** | last-known **~2.09 EGLD** (nonce 1468, 19 Sep) — accounts API **stale** |
| **Indexer** | **partiel** post recovery hardfork **v2.1.3.0** (23 Sep) |

Pas un fonds retail. Tips ≠ investissement. User Connect ≠ LIA Ops.

## Verdict 24 sept

Galerie / `/demo` / `/go-live` / `/slot` live UI. Market List/Buy/Bid OFF. Packs catalog paper. Staking/gov/minter empty (last-known). LIA paper. Treasury dest null. RWA escrow experimental. GSN/Contrarian non branchés. MX-8004 **not registered**.

**Delta vs 19 sept :**
- Epoch 2241 → **2242** (J+8 → J+9).
- `/stats` toujours 200 (refreshRate 600, 133 427 564 blocks).
- `/economics`, `/accounts`, `/tokens` → **500 / 404**. Gateway `internal_issue`.
- Collections / NFTs **OK** (NFTUDURI-2990b6 lisible).
- Probe UI **plus all-or-nothing** : stats live + last-known soldes, banner « dégradé ».
- SlotPage n’était qu’un PLACEHOLDER malgré la nav — **UI paper réelle** restaurée + route `/slot`.
- **Ne pas déployer de SC** tant que `/accounts` ne répond pas (impossible de vérifier codeHash).

## Probe API ~04:32 UTC 24 sept

stats: refreshRate **600**, epoch **2242**, roundsPerEpoch 144000, roundsPassed **37943** (~26 % epoch), accounts 9 262 948, tx 628 538 339, blocks 133 427 564, shards 3.

economics: **500 Internal server error** — last-known 19 Sep EGLD **$4.09** ; books 24 Sep ~**$4.13** (OKX close). Non utilisé comme live.

accounts LIA Ops `erd1p4zyy…0crn6`: **404 Account not found** (indexer) — last-known **2.093 EGLD**, nonce 1468.
GrokyversX : unread — last-known 0 EGLD, nonce 8.

TRO-94c925: **500** — last-known supply 476 224 / 500 000, 562 comptes, 2788 tx.

SC marketplace/staking/gov/minter: **unread** — last-known codeHash null, balance 0. Fail-closed = empty.

NFTUDURI-2990b6: 12 œuvres lues (Meteorite, Artpocalypse Now, Serenity, Strange Cat, Co$miC Traveller, Father, Liberté, Antibes…).

## Code 24 sept

- `networkProbe` — fetch **soft** par endpoint ; stats/econ/accounts/tokens indépendants
- `NetworkLiveStrip` — statut live / dégradé / cache + banner indexer
- `/demo` — 10 étapes (Slot + GO_LIVE) + gates API
- `/go-live` — gate « indexer healthy » **avant** deploy
- `/slot` — Primordial Slot paper (bank TRO, scatter, jackpot RWA locké)
- `App` route `/slot` (manquait malgré BottomNav)
- contracts.json + snapshot 24 sept
- recap + veille 24 sept

Non touché: live trading, PEM, Dependabot majors, **deploy SC** (volontaire — PEM hors git **et** indexer down).

## Veille technologique

### Recovery hardfork v2.1.3.0 (23 Sep 14:19 UTC)

- Config [mx-chain-mainnet-config v2.1.3.0](https://github.com/multiversx/mx-chain-mainnet-config/releases/tag/v2.1.3.0).
- Contexte 19–22 Sep : halt / repair d’état (atomicité VM). Shadow-fork puis recovery checkpoint. Nodes **doivent** être en v2.1.x.
- 24 Sep : `/stats` proxy OK, **Elasticsearch / accounts / economics / tokens** encore cassés. Gateway `sending request error`.
- Explorer HTML sert encore un bundle daté **19 Sep**.
- **Conséquence xArtists :** aucune TX ops, aucun `runbook_deploy`, aucun flag `VITE_*_CODEHASH_OK` tant que `GET /accounts/{addr}` ne rend pas un JSON.

### Supernova

- Live depuis 10 Sep 18:06 UTC, round 32 157 661, epoch 2233. 600 ms, 144 000 rounds/epoch.
- Probe 24 Sep = **J+9**. Stabilité 600 ms **avant** ZK natif / I/O state. 400 ms évoqué, non calendré.

### EGLD

- 10 Sep (activation) wick ~$5.7 puis dump. 19 Sep ~$4.09. 23 Sep volatile $4.11–4.63. 24 Sep books ~**$4.13** (−~9 % vs 23 close selon sources).
- Circ ~30.82M, mcap ~$127M. DEX mince. Paper d’abord.

### Agent economy / MX-8004

- First 100 (1 EGLD) : Identity + 5 jobs + trust >90.
- Manifest LIA prêt (`data/mx8004_lia_manifest.json`). **register_agent bloqué** : indexer + registries mainnet à confirmer **après** recovery.
- sdk-dapp v5 = doc standard ; front encore v3 — **après** codeHash, pas pendant l’indexer down.

### SC

- typed time (`multiversx-sc >= 0.63.1`) obligatoire avant deploy 600 ms.
- Slot SC : skeleton docs only. Paper RNG client.

## P0 — suite logique (ordre, 24 sept)

0. **WAIT indexer** — `/accounts` + `/economics` + `/tokens` 200. Re-probe LIA Ops + codeHash.
1. **Wallets treasury dest** (mission / reserve / reward / ops) — encore **null**
2. **PEM opérateur** en coffre local — jamais chat / git / Vellum logs
3. `./scripts/runbook_deploy.sh dry` puis **deploy market + agents** (seulement si LIA Ops live ≥ ~2 EGLD **et** accounts API live)
4. `verify_marketplace_codehash.py` — flags Pages **seulement** si hash non null
5. Treasury splitter
6. Revue SC typed-time
7. Paper stable **puis** micro live — jamais un saut
8. MX-8004 `register_agent` **après** 0–4

*Neltud via Grok — 24 septembre 2026*

---

## Archive 19 sept

Probe epoch 2241, EGLD $4.09, LIA Ops 2.09 EGLD (P0 fund). SC empty. Voir git 0.34.0 / `93ea4ff`.

## Archive 17 sept

Probe epoch 2239, EGLD $3.85, LIA Ops 0.093 EGLD. `/demo` 8 étapes. Voir efaa895 / fcef003.
