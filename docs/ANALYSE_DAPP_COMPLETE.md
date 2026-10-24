# Analyse DApp complète xArtists — 24 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. Le **client** force `VITE_LIA_LIVE_TRADING=0`.

**Le go-live trading n’a pas lieu.** Le 23 oct ~06:02 UTC, Upbit a **prolongé** la surveillance EGLD jusqu’au **16–20 novembre 2026** (notice `207379109`). Bithumb a prolongé le warning EGLD (et FET) le même jour. La doctrine du 21 oct s’applique : prolongation = rester paper. Ce push met le site à jour, il n’allume rien.

Probe API du **24 oct ~04:40 UTC**. CodeHash agents inchangé (`igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`). `getPackPrice` **10 / 5 / 2.5** EGLD. Market et slot : hashes inchangés vs le 17 oct. Treasury dest toujours null. LIA Ops nonce **1479** figé.

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Packs** | https://neltud.github.io/xArtists/#/agents |
| **Musée** | https://neltud.github.io/xArtists/#/museum |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **Site public en lecture** — LIA **client paper** — spin REAL **fermé** — Paybox **501** |
| **Indexer** | healthy · epoch **2272** · refreshRate **600** · rounds/epoch 144000 |
| **Supernova** | LIVE depuis le 10 sept 2026 (epoch 2233) · **+39 epochs** |
| **EGLD** | **$3,46** · mcap **$107,3M** · circ 31,025M · staked 13,941M · APR **9,06 %** |
| **LIA Ops** | **1,585598 EGLD** · nonce **1479** (aucune TX depuis le 17 oct) |
| **Slot** | **0,5000 EGLD** · hash inchangé · REAL fermé |
| **Market** | **0,0175 EGLD** · hash inchangé · `getListing` 1 et 2 répondent encore (ASFT-a6273a nonce 1) · acheter seulement l’id actif (**#2**) |
| **Agents SC** | **0,013 EGLD** · `getPackPrice` **10 / 5 / 2.5** |
| **$TRO** | `TRO-94c925` · circ **476 224** · **562** comptes · ~$0,0000843 · mcap **~$40** |
| **Build** | stamp Pages **0.120.0** · `VITE_LIA_LIVE_TRADING=0` |

---

## Couches produit

| Layer | Rôle | État 24 oct |
|-------|------|-------------|
| Studio / Gallery | NFT (NFTUDURI + musée) | Lecture API + musée immersif |
| Marketplace | List / Buy / Bid | SC live · escrow `ASFT-a6273a-01` · id **#2** seulement · pas de prix inventé |
| Agents | Pulse · Yield · Sentinel | SC live · 10 / 5 / 2,5 EGLD · fiat 110 / 75 / 50 € **non encaissable** |
| LIA | Copilote | **Client paper**. Wallet ops a tradé le 17 oct seulement |
| $TRO | Utility | Illiquide (562 comptes). Pas une preuve visiteur nouvelle |
| Slot | Primordial | House 0,5 · REAL fermé |
| Treasury | Split fees | codeHash live · **destination null** · balance 0 |

Le pulse public (`protocolPulse.ts`) existait depuis le 21 oct mais **n’était importé par aucune page**. `/go-live` affichait les gates SC sans la phrase de revue. Corrigé : `ProtocolPulsePanel` est monté sur `/go-live`.

---

## Veille technologique (24 oct ~04:40 UTC)

### Corée — bloquant n°1, décision tombée : prolongation

- **Upbit**, 23 oct 06:02 UTC, compte officiel : la période « investment warning » de MultiversX (EGLD/KRW, EGLD/BTC, EGLD/USDT) est étendue jusqu’à la **3ᵉ semaine de novembre 2026 (16–20 nov)**. Notice : https://www.upbit.com/service_center/notice?id=207379109
- **Bithumb**, 23 oct : warning EGLD **et FET** prolongé. EGLD n’est pas dans les delist déjà décidés (SOPH / ZIL, dernier jour de trade annoncé plus tôt au 16 nov — ce calendrier ne s’applique pas à EGLD).
- Upbit a aussi suspendu les **retraits** EGLD le 21 oct 20:00 KST pour un upgrade réseau, jusqu’à confirmation de stabilité. L’asset reste un item sous surveillance, retraits seulement.
- EGLD **$3,46** (API `/economics`), sous les ~$3,73 du 21 oct et loin des ~$4,60 de début octobre. Mcap ~$107M. Ce n’est pas un signal de trade.
- Conséquence produit : **aucun nouveau trade live LIA**, même micro. Le site (galerie, musée, market en lecture, packs) reste public. Ne pas appeler ce déploiement un go-live trading.

### MultiversX

- Supernova 600 ms stable. Epoch **2272** (2269 le 21 oct). Rien de protocole à shipper.
- API publique : `/stats`, `/economics`, `/accounts`, `/tokens/TRO-94c925`, `vm-values/query` `getPackPrice` répondent. Packs confirmés **10 / 5 / 2.5**.
- Front : `@multiversx/sdk-dapp` ^3, Vite 5, Node **20** sur le runner Pages. Ne pas merger les majors Dependabot (Vite 8, ESLint 10) sans QA.
- Stack Vellum (Hatom, orchestrateur multi-chain, relayer gasless) reste **hors chemin critique** tant que la revue KR n’est pas levée par une annonce de maintien.

### Wallet ops (à ne pas confondre avec le client)

Le 17 oct 12:57–13:02 UTC, `erd1p4zyy…qu0crn6` a signé wrap / addLiquidity ×2 / swap / multiPairSwap / xo. Nonce **1479** inchangé le 24 oct. Solde **1,585598 EGLD**. Ces TX n’autorisent pas un nouveau live.

### NFT / agents / fiat

- MX-8004 : LIA non inscrit. Après une annonce de maintien seulement.
- Paybox : module HMAC/IPN fail-closed en repo. **501** tant que les secrets preprod + preuve IPN + mint ne sont pas faits. `VITE_PAYBOX_ENABLED=false` dans `static.yml`. Stripe fail-closed.
- Acheter un pack en EGLD dépense 10 / 5 / 2,5 vrais EGLD. Paper mint = DEV only.

---

## Ce passage (0.120.0)

1. `upbitPosture` distingue `before` / `window` / **`extended`** / `after`. Le 24 oct n’est plus « fenêtre échue, peut-être maintenir » : c’est une **prolongation publiée**.
2. `/go-live` monte le pulse (epoch, EGLD, LIA, agents, market, slot, $TRO) et la phrase de prolongation. Un échec token n’efface pas le reste.
3. Test CI `tests/kr-review.test.mjs` (esbuild + `node --test`) pour que `npm run test:release` casse si quelqu’un reclasse le 24 oct en clairance.
4. Stamp Pages **0.120.0**. `VITE_LIA_LIVE_TRADING` reste **0**.

---

## Sécurité — inchangé

- Ne pas committer `VITE_*_CODEHASH_OK=1`.
- Ne pas financer les placeholders legacy vides.
- Ne pas `claimFees` (destination trésorerie null).
- Ne pas forcer le slot payable : le compte rejette l’EGLD.
- Ne pas coller de PEM. Ne pas annoncer un fonds retail.
- Ne pas interpréter « la date du 23 oct est passée » comme une autorisation. L’annonce du 23 oct est une **extension**, pas une levée.

---

## Suite

Voir [`SUITE_LOGIQUE_NOW.md`](./SUITE_LOGIQUE_NOW.md).
