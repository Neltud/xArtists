# Mainnet preparation checklist

## A. Produit front

- [ ] Hash routes OK (`404.html` rewrite)
- [ ] Hard-refresh / SW v9+ après chaque deploy
- [ ] Pages critiques : `/`, `/museum`, `/agents`, `/trading`, `/slot`, `/wallet`, `/go-live`, `/lia`
- [ ] xPortal WC + Web Wallet callback Pages
- [ ] DEMO_MODE banner clair

## B. Smart contracts

- [ ] agents-marketplace / nft-marketplace build + verify codeHash
- [ ] slot-casino build + deploy + seed progressive
- [ ] `data/contracts.json` chain=1 only
- [ ] `VITE_*_CODEHASH_OK` seulement après verify
- [ ] PEM hors git

## C. Vellum / LIA

- [ ] Workflows intents branchés GitHub demo
- [ ] PEM Vellum en secret ops uniquement
- [ ] Guardian caps documentés
- [ ] Paper journal vs live journal séparés

## D. GO_LIVE gate

- [ ] Page `/go-live` tout vert
- [ ] Micro-EGLD blackbox
- [ ] Pause endpoints testés
- [ ] Communication Discord : paper vs live

## E. Agents performance

- [ ] Packs Pulse/Yield/Sentinel UX checkout
- [ ] Board MTM prix live
- [ ] Roadmap compounding 10 colonnes visible
