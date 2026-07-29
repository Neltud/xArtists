# Roadmap commercial xArtists + LIA

## Fait (données repo — 2026-07-29)

- [x] Supply $TRO documentée ≈ **476 223**
- [x] Pool **OneDex TRO/EGLD** référencée (`data/tro_pool.json`)
- [x] Template positions **Hatom** (collateral + HTM, pas de borrow)
- [x] Spec **Achat en EUR** (MoonPay en premier)
- [x] **CGU + disclaimer + commissions** (`docs/LEGAL.md`)
- [x] Spec **chart $TRO** (DexScreener embed)
- [x] Workflow exclusif Pages renforcé

## À brancher dans le dashboard live (`docs/index.html` / Vellum)

1. Lire `data/tro_pool.json` → afficher supply 476223 + lien pool OneDex (plus "Aucune pool").
2. Lire `data/hatom_lia.json` + API réelle → collateral / HTM (plus $0 fictif).
3. Bouton **Acheter en EUR** → MoonPay puis paiement NFT on-chain.
4. Footer lien vers `LEGAL.md` + tableau des frais.
5. Iframe DexScreener sur la page $TRO.
6. BTC tip : `bc1qrsmtgwlqvd66vkpng26yf8c8s07df332ac052z`

## Ensuite

- GreenSmoke top 10 agents
- Performance fee LIA 15 % (high-water mark)
- xMoney webhooks production

## Commissions (rappel)

| Type | % |
|------|---|
| Vendeur marketplace | 2,5 % |
| Acheteur | 0,5 % |
| Royalty secondaire | 5 % |
| RWA escrow | 2 % |
| Performance LIA | 15 % sur PnL + |
