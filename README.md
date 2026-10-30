# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists

Publication du 30 octobre : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md).  
La revue coréenne est **prolongée** (Upbit notice 207379109, 16–20 nov). Le site est en ligne. Le trading autonome ne l’est pas.

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

**Dernier état GitHub Pages visé par ce push (2026-10-30) : site public · micro-signature xPortal armée · pas de broadcast LIA Ops · Paybox UI fail-closed · prolongation KR**

- Bundle stamp **0.125.0** (`static.yml`). `VITE_LIA_LIVE_TRADING` défaut **1** = signature utilisateur seulement. `VITE_PAYBOX_ENABLED` défaut **false** tant que la variable GitHub n’est pas posée après une IPN verte.
- Probe **30 oct 05:36 UTC**, epoch **2278**, refreshRate 600. CodeHash agents inchangé.
- Prix packs : Pulse **10** / Yield **5** / Sentinel **2.5** EGLD (`getPackPrice`). Fiat **110 / 75 / 50** €. Paybox public **fermé** (fail-closed). Rail Render = preprod, pas prod.
- Market **0,0175 EGLD**. Listing **#2** reste la seule cible d’achat (ASFT). Ne pas acheter l’id **#1**. Le 0,25 EGLD est une preuve historique, pas le solde du SC.
- Slot house **0,5000 EGLD**. REAL spin fermé (`isPayable=false`).
- LIA Ops **1,585598 EGLD**, nonce **1479** (figé depuis les swaps du 17 oct). Le snapshot du 28 oct (epoch 2276, $3,37) n’est plus le repli.
- EGLD **$3,21** · mcap ~$99,73M · circ 31,07M · staked ~13,89M · APR ~9,13 %.
- $TRO `TRO-94c925` circ **476 224** · **561** comptes · ~$0.00007902 · mcap ~$37,63 · 2815 tx.
- **Upbit + Bithumb** : warning **toujours prolongé jusqu’au 16–20 nov 2026**. Au probe : jour **7/29**, **17 jours** avant le 16 nov, **22 jours** avant le 21 nov 00:00 UTC. Statut wallet Upbit observé : **retraits ouverts, dépôts bloqués**, désignation toujours affichée. Ce n’est pas une levée. La fenêtre FET Bithumb (2–6 nov) n’est pas une levée EGLD.
- Treasury dest **null** — ne pas router les frais.
- PR #200 (Neon orders) non mergée : lockfile cassé.
- `ci-cd.yml` désactivé. Go-live site = `static.yml`.
- Legacy empty placeholders must **never** receive funds.
- Not a retail investment fund. Autonomous paper until an explicit maintain notice.
