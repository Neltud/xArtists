# Analyse DApp complète xArtists — 21 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. Le **client** force `VITE_LIA_LIVE_TRADING=0`.

Probe API du **21 oct ~04:35 UTC**. CodeHash agents inchangé (`igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`). `getPackPrice` **10 / 5 / 2.5** EGLD. Market `isPayable=true`. Slot `isPayable=false` — spin REAL fermé. Treasury dest toujours null.

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Packs** | https://neltud.github.io/xArtists/#/agents |
| **Musée** | https://neltud.github.io/xArtists/#/museum |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_LIVE site + SC en lecture** — LIA **client paper** — spin REAL **fermé** — Paybox **fermé** |
| **Indexer** | healthy · epoch **2269** · refreshRate **600** · rounds/epoch 144000 |
| **Supernova** | LIVE depuis le 10 sept 2026 (epoch 2233) · **+36 epochs** |
| **EGLD** | **$3,73** · mcap **$115,6M** · circ 31,004M · staked 14,273M · APR **8,86 %** |
| **LIA Ops** | **1,585598 EGLD** · nonce **1479** (aucune TX depuis le 17 oct) |
| **Slot** | **0,5000 EGLD** · `isPayable=false` · hash `UZ0nX6dWsSgkVqjnFnR5zPNPk1UrNtR5SsrYf96VJCs=` |
| **Market** | **0,0175 EGLD** · `isPayable=true` · listing #2 actif 0,25 · #1 mort · bid 0,01 |
| **Agents SC** | **0,013 EGLD** · `getPackPrice` **10 / 5 / 2.5** · compte non payable en EGLD brut |
| **$TRO** | `TRO-94c925` · circ **476 224** · **562** comptes · ~$0,000084 · mcap **~$40** |
| **Build** | stamp Pages **0.118.0** · `VITE_LIA_LIVE_TRADING=0` |

---

## Couches produit

| Layer | Rôle | État 21 oct |
|-------|------|-------------|
| Studio / Gallery | NFT (NFTUDURI + musée) | Lecture API + musée immersif |
| Marketplace | List / Buy / Bid | SC live · un NFT escrow `ASFT-a6273a-01` · acheter seulement l’id que `getListing` marque actif (**#2**) · pas de prix inventé |
| Agents | Pulse · Yield · Sentinel | SC live · 10 / 5 / 2,5 EGLD · fiat 110 / 75 / 50 € **non encaissable** |
| LIA | Copilote | **Client paper**. Wallet ops a tradé le 17 oct seulement |
| $TRO | Utility | Illiquide (562 comptes). Stake historique, pas une nouvelle preuve visiteur |
| Slot | Primordial | House 0,5 · REAL fermé · fun seulement |
| Treasury | Split fees | codeHash live · **destination null** · balance 0 |

---

## Veille technologique (21 oct ~04:35 UTC)

### MultiversX
- Supernova 600 ms stable. Epoch **2269** (2268 le 20 oct). Rien de protocole à shipper.
- API publique : `/stats`, `/economics`, `/accounts`, `/tokens/TRO-94c925`, `vm-values/query` `getPackPrice` répondent.
- Front : `@multiversx/sdk-dapp` ^3, Vite 5, Node **20** sur le runner Pages. Ne pas merger les majors Dependabot (Vite 8, ESLint 10) sans QA.

### Upbit / Bithumb (bloquant n°1)
- EGLD **$3,73** (+2,2 % vs $3,65 le 20 oct). Toujours loin des ~$4,60 de début octobre.
- **Upbit** : surveillance depuis le **21 sept 2026** (EGLD/KRW, EGLD/BTC, EGLD/USDT). Dépôts et retraits haltés. Au **21 oct 03:04 UTC**, les suivis publics classent encore EGLD en **investment warning**, pas en delist. Delist décidés : **SOPH** et **ZIL**, dernier jour de trade **16 nov**.
- **Bithumb** : article du 18 oct — revue FET, **EGLD**, CAMP, XAI sur la **même fenêtre 19–23 oct** (levée, prolongation, ou fin de support). Aucune décision EGLD trouvée à cette sonde.
- Conséquence : **aucun nouveau trade live LIA**, même micro. Le site SC (galerie, musée, market lecture, packs) reste public.

### Wallet ops (à ne pas confondre avec le client)
Le 17 oct 12:57–13:02 UTC, `erd1p4zyy…qu0crn6` a signé wrap / addLiquidity ×2 / swap / multiPairSwap / xo. Nonce **1479** inchangé le 21 oct. Solde **1,585598 EGLD**. Ces TX n’autorisent pas un nouveau live.

### NFT / agents / fiat
- MX-8004 : LIA non inscrit. Après une annonce de maintien seulement.
- Paybox : **501** tant que HMAC + IPN + mint ne sont pas prouvés. Stripe fail-closed.
- Acheter un pack en EGLD dépense 10 / 5 / 2,5 vrais EGLD. Paper mint = DEV only.

---

## Ce passage (0.118.0)

1. `/go-live` lit en plus les soldes agents / market / slot et le token `$TRO` sur l’API publique. Un échec token n’efface pas epoch / EGLD / LIA.
2. La phrase de revue compte le jour (1–5) et cite Bithumb sur la même fenêtre, sans inventer une décision.
3. Stamp Pages **0.118.0**. `VITE_LIA_LIVE_TRADING` reste **0**. Le package frontend n’était plus à 0.113.0.

---

## Sécurité — inchangé

- Ne pas committer `VITE_*_CODEHASH_OK=1`.
- Ne pas financer les placeholders legacy vides.
- Ne pas `claimFees` (destination trésorerie null).
- Ne pas forcer le slot payable : le compte rejette l’EGLD.
- Ne pas coller de PEM. Ne pas annoncer un fonds retail.

---

## Suite

Voir [`SUITE_LOGIQUE_NOW.md`](./SUITE_LOGIQUE_NOW.md).
