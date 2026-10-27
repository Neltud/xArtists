# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists

Publication du 27 octobre : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md).  
La revue coréenne est **prolongée** (Upbit notice 207379109, 16–20 nov). Le site est en ligne. Le trading ne l’est pas.

**Catalogue packs (Rule 1 — 2026-10-27)**  
Client : Pulse **110 €** · Yield **75 €** · Sentinel **50 €** (marge 4 % **interne**).  
Devis serveur : `POST /v1/checkout/quote` · TTL 12 min · EGLD ceil 4 dp · tolérance ≤ 0,02 €.  
Spec : [`docs/PACK_QUOTE_RULE1.md`](docs/PACK_QUOTE_RULE1.md) · Escrow NFT P1 : [`docs/ESCROW_NFT_P1.md`](docs/ESCROW_NFT_P1.md) · Rails : [`docs/MULTICHAIN_PAYMENT_RAILS.md`](docs/MULTICHAIN_PAYMENT_RAILS.md).

**Marketplace**  
P1 = escrow NFT MultiversX (pay vs delivery atomique). Physique = tracking manuel d’abord. Dropship exclu P1–P2.

**Vellum · mise à jour LIA Wallet :**
[`docs/VELLUM_LIA_WALLET_DIRECTIVES.md`](docs/VELLUM_LIA_WALLET_DIRECTIVES.md)
— directives MultiversX / PayBox, stratégies, validations des ordres réels et
critères de livraison. Spécification de mise à jour ; aucune activation live.

**Dernier état GitHub Pages visé par ce push (2026-10-27) : site public en lecture · LIA client paper · prolongation KR · slot non payable**

- Bundle stamp **0.123.0** (`static.yml`). `VITE_LIA_LIVE_TRADING=0`.
- Probe **27 oct ~05:35 UTC**, epoch **2275**, refreshRate 600. CodeHash agents inchangé.
- Prix packs : Pulse **10** / Yield **5** / Sentinel **2.5** EGLD (`getPackPrice`). Fiat **110 / 75 / 50** €, Paybox **fermé** (501).
- Market **0,0175 EGLD**. Listing **#2** reste la seule cible d’achat (ASFT). Ne pas acheter l’id **#1**. Le 0,25 EGLD est une preuve historique, pas le solde du SC.
- Slot house **0,5000 EGLD**. REAL spin fermé.
- LIA Ops **1,585598 EGLD**, nonce **1479** (figé depuis les swaps du 17 oct). Le snapshot du 26 oct (epoch 2274, $3,23) n’est plus le repli.
- EGLD **$3,22** · mcap ~$99,97M · staked ~13,89M · APR ~9,09 %.
- $TRO `TRO-94c925` circ **476 224** · **562** comptes · ~$0.0000809 · mcap ~$38,5.
- **Upbit + Bithumb** : warning **toujours prolongé jusqu’au 16–20 nov 2026**. Jour **4/29**. **20 jours** avant le 16 nov. La fenêtre FET Bithumb (2–6 nov) n’est pas une levée EGLD. Pas de trade live.
- Treasury dest **null** — ne pas router les frais.
- `ci-cd.yml` désactivé. Go-live site = `static.yml`.
- Legacy empty placeholders must **never** receive funds.
- Not a retail investment fund. Paper until explicit GO.
