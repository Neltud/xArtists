# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists

Publication du 1er novembre : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md).  
La revue coréenne est **prolongée** (Upbit notice 207379109, 16–20 nov). Le site est en ligne. Le trading autonome ne l’est pas. Le gel LIA Ops annoncé le 30 oct au matin a été **rompu le soir même** (8 signatures, dont 7,09 EGLD sortis). On ne le rouvre pas.

**Catalogue packs (Rule 1 — 2026-10-27)**  
Client : Pulse **110 €** · Yield **75 €** · Sentinel **50 €** (marge 4 % **interne**).  
Devis serveur : `POST /v1/checkout/quote` · TTL 12 min · EGLD ceil 4 dp · tolérance ≤ 0,02 €.  
Spec : [`docs/PACK_QUOTE_RULE1.md`](docs/PACK_QUOTE_RULE1.md) · Escrow NFT P1 : [`docs/ESCROW_NFT_P1.md`](docs/ESCROW_NFT_P1.md) · Rails : [`docs/MULTICHAIN_PAYMENT_RAILS.md`](docs/MULTICHAIN_PAYMENT_RAILS.md).

**Marketplace**  
P1 = escrow NFT MultiversX (pay vs delivery atomique). Physique = tracking manuel d’abord. Dropship exclu P1–P2.

**Vellum · mise à jour LIA Wallet :**  
[`docs/VELLUM_LIA_WALLET_DIRECTIVES.md`](docs/VELLUM_LIA_WALLET_DIRECTIVES.md)  
— directives MultiversX / PayBox, stratégies, validations des ordres réels et critères de livraison. Spécification. Aucune activation live.

**État GitHub Pages visé par ce push (2026-11-01) : site public · trading paper · LIA Ops à ne plus signer · Paybox UI fail-closed · prolongation KR**

- Bundle stamp **0.126.0** (`static.yml`). `VITE_LIA_LIVE_TRADING` défaut workflow **0**. `VITE_PAYBOX_ENABLED` défaut **false**.
- Probe **1 nov 05:48 UTC**, epoch **2280**, refreshRate 600. CodeHash agents inchangé.
- Prix packs : Pulse **10** / Yield **5** / Sentinel **2.5** EGLD (`getPackPrice`). Fiat **110 / 75 / 50** €. Paybox public **fermé**.
- Market **0,0175 EGLD**. Listing **#2** seule cible d’achat (ASFT). Ne pas acheter l’id **#1**. Le 0,25 EGLD est une preuve historique.
- Slot house **0,5000 EGLD**. REAL spin fermé (`isPayable=false`).
- LIA Ops **0,907888 EGLD**, nonce **1487**. Dernière activité : **30 oct 17:29 UTC**, transfert 7,09 EGLD vers le owner `$TRO` après une série `xo` / `removeLiquidity`. Le snapshot « nonce 1479 figé » est caduc.
- EGLD **$3,44** · mcap ~$106,92M · circ 31,08M · staked ~13,90M · APR ~9,12 %.
- $TRO `TRO-94c925` circ **476 224** · **561** comptes · ~$0.00008223 · mcap ~$39,16 · 2815 tx.
- **Upbit + Bithumb** : warning EGLD **prolongé jusqu’au 16–20 nov 2026**. Au probe : jour **9/29**, **15 jours** avant le 16 nov, **20 jours** avant le 21 nov 00:00 UTC. Aucune notice de levée le 1er nov. La fenêtre FET Bithumb (2–6 nov) n’est pas une levée EGLD.
- Treasury dest **null** — ne pas router les frais.
- PR #200 (Neon orders) non mergée : lockfile cassé.
- `ci-cd.yml` désactivé. Go-live site = `static.yml`.
- Legacy empty placeholders must **never** receive funds.
- Not a retail investment fund. Not an autonomous trading go-live.
