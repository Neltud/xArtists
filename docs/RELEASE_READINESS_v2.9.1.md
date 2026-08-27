# Release readiness — v2.9.1-demo

**Date :** 2026-08-27  
**Pages :** https://neltud.github.io/xArtists/  
**Verdict UI :** GO_DEMO

## Green

- [x] HashRouter SPA · index/404 asset sync
- [x] Entity map 15 branches + verdict
- [x] Voyage agent page + pack
- [x] On-ramp modal + MoonPay button
- [x] Intent ⌘K (voyage, entity, onramp, trading…)
- [x] Trading : board, liquidity paper, compounding, paper legs
- [x] Sim Lab client-side
- [x] Personas → entity / board / voyage
- [x] PageGuides entity · voyage · sim · trading
- [x] Data JSON critical on Pages

## Red / blocked (ops)

- [ ] Marketplace SC deployed + codeHash verified
- [ ] Agents mint SC deployed
- [ ] LIA ops EGLD funded for deploy/gas
- [ ] Micro List/Buy tip path user wallet
- [ ] LIA_LIVE_CONFIRMED only after proofs

## Tag suggestion

```bash
git tag -a v2.9.1-demo -m "GO_DEMO shell · entity · voyage · onramp · paper LIA"
git push origin v2.9.1-demo
```

## Vellum next

Voir [VELLUM_P0_CHECKLIST.md](VELLUM_P0_CHECKLIST.md).
