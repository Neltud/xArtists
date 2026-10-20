# Analyse DApp complète xArtists — 20 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. Le **client** force `VITE_LIA_LIVE_TRADING=0`.

Probe API du **20 oct ~04:40 UTC**. CodeHash produit inchangés (agents = upgrade `buyPack`). Packs déverrouillables via runtime explorer. Slot REAL fermé (`isPayable=false`).

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Packs** | https://neltud.github.io/xArtists/#/agents |
| **Musée** | https://neltud.github.io/xArtists/#/museum |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_LIVE SC** — packs runtime unlock — LIA **client paper** — spin REAL **fermé** — Paybox **fermé** |
| **Indexer** | healthy · epoch **2268** · refreshRate **600** · rounds/epoch 144000 |
| **Supernova** | LIVE depuis le 10 sept 2026 (epoch 2233) · **+35 epochs** |
| **EGLD** | **$3,65** · mcap **$113,1M** · circ 30,997M · staked 14,270M · APR **8,87 %** |
| **LIA Ops** | **1,585598 EGLD** · nonce **1479** |
| **Slot** | **0,5000 EGLD** · `isPayable=false` · min bet **0,001** |
| **Market** | **0,0175 EGLD** · `isPayable=true` · listing #2 actif 0,25 · #1 mort · bid 0,01 |
| **Agents SC** | **0,013 EGLD** · `getPackPrice` **10 / 5 / 2.5** · codeHash buyPack intact |
| **$TRO** | circ 476 224 · 562 comptes · ~$0,000083 · mcap ~$40 |
| **Build** | stamp Pages **0.117.0** (le stamp workflow était resté à 0.113.0 après la release 0.116.1) |

---

## Couches produit

| Layer | Rôle | État 20 oct |
|-------|------|-------------|
| Studio / Gallery | NFT (NFTUDURI + musée) | Lecture API + musée immersif déjà livré |
| Marketplace | List / Buy / Bid | SC live · **un** NFT escrow `ASFT-a6273a-01` · acheter seulement l’id que `getListing` marque actif (**#2**) |
| Agents | Pulse · Yield · Sentinel | SC live · prix on-chain 10/5/2.5 · fiat 110/75/50 € **non encaissable** |
| LIA | Copilote | **Client paper**. Wallet ops a tradé le 17 oct (voir veille) |
| $TRO | Utility | Stake historique prouvé · toujours illiquide (562 comptes) |
| Slot | Primordial | House 0,5 · REAL fermé · fun seulement |
| Treasury | Split fees | codeHash live · **destination null** |

---

## Veille technologique (20 oct)

### MultiversX
- Supernova 600 ms stable. Epoch **2268** (2265 le 17 oct). Pas de changement protocole à shipper.
- API `api.multiversx.com` : `/stats`, `/economics`, `/accounts`, `/query` répondent.
- Front : `@multiversx/sdk-dapp` ^3, Vite 5, Node **20** sur le runner Pages. `@multiversx/sdk-network-providers` reste déprécié. Ne pas merger les majors Dependabot (Vite 8, ESLint 10) sans QA.

### Upbit / prix (bloquant n°1)
- EGLD **$3,65** (−1,4 % vs $3,70 le 17 oct). Toujours loin des ~$4,60 de début octobre.
- Depuis le **21 sept**, Upbit a mis EGLD/KRW, EGLD/BTC et EGLD/USDT en **investissement sous surveillance** après l’incident VM du 19 sept. Dépôts et retraits décrits haltés ; si reprise, retraits d’abord.
- Fenêtre de décision **19–23 octobre 2026**. Au matin du 20 oct, les listes de delist décidés citent **SOPH et ZIL** (dernier jour de trade **16 nov**), **pas EGLD**. La revue peut encore lever l’alerte, la prolonger, ou delister.
- Conséquence produit : **aucun nouveau trade live LIA**, même micro, tant que cette annonce n’est pas claire.

### Ce que le wallet ops a déjà fait (à ne pas confondre avec le client)
Le 17 oct entre 12:57 et 13:02 UTC, `erd1p4zyy…qu0crn6` (LIA Ops, pas le visiteur) a réussi :
`wrapEgld` 0,11024 · `addLiquidity` ×2 · `swap` · `multiPairSwap` · `xo`.
Nonce 1473 → 1479. Solde 1,6038 → **1,5856 EGLD**.
Le site public n’a pas le flag live. Ces TX ne sont pas une autorisation de recommencer.

### NFT / agents / fiat
- OOX SDK non branché. MX-8004 (agents.multiversx.com) : LIA **non** inscrit, First 100 pas commencé — après Upbit, pas avant.
- Paybox : `POST /v1/checkout/paybox` = **501**. `VITE_PAYBOX_ENABLED` requis en plus d’un HMAC + IPN + mint prouvé. Stripe stub déjà fail-closed.
- Acheter un pack en EGLD dépense 10 / 5 / 2,5 vrais EGLD et mint 1 NFT. Paper mint = DEV only.

---

## Correctifs de ce passage

1. `/go-live` affiche la veille lue en direct (epoch, prix EGLD, solde et nonce LIA Ops) et la phase Upbit calculée sur l’horloge du visiteur (avant / fenêtre / après le 23 oct).
2. Le panier marketplace ne fabrique plus un prix **0,25 EGLD** si `getListing` ne renvoie pas de prix. Seul un id actif décodé est achetable.
3. Stamp bundle **0.117.0** pour que le prochain `static.yml` soit identifiable (le 0.113.0 était périmé).

---

## Sécurité — ce qui ne change pas

- Ne pas committer `VITE_*_CODEHASH_OK=1`.
- Ne pas financer les placeholders legacy vides.
- Ne pas `claimFees` tant que la destination trésorerie est null.
- Ne pas forcer `VITE_SLOT_CODEHASH_OK` : le compte slot non payable rejette l’EGLD.
- Ne pas coller de PEM. Ne pas annoncer un fonds retail.

---

## Suite (ordre)

Voir [`SUITE_LOGIQUE_NOW.md`](./SUITE_LOGIQUE_NOW.md).

1. Laisser `static.yml` vert sur **0.117.0**, hard refresh.
2. Tenir le paper jusqu’à l’annonce Upbit (23 oct au plus tard dans la fenêtre annoncée).
3. Une TX **utilisateur** (stake 1 TRO, ou achat pack, ou buy/bid listing #2) reste la preuve produit manquante — pas une TX du wallet ops.
4. Après maintien Upbit seulement : micro-trade ops journalisé, MX-8004, slot payable sur le **même** contrat, index déjà en place.
