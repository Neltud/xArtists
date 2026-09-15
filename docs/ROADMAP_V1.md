# Roadmap v1 — status aligned to GO_DEMO

> **P0 2026-09-15:** Supernova is **live on mainnet**. Product SCs are still **not deployed**.  
> Truth: [`SOURCE_OF_TRUTH.md`](./SOURCE_OF_TRUTH.md) + `data/contracts.json`.

## Current phase: **GO_DEMO**

| Priority | Label | Honest status |
|----------|--------|----------------|
| 1 | LIA + agents marketplace | **Paper / stub executor** · SC not deployed |
| 2 | Marketplace NFT + LP TRO | **UI + addresses reserved** · SC not deployed |
| 3 | PWA / responsive | Base delivered (verify Lighthouse separately) |
| 4 | E2E + monitoring | **Not** claimed green until Playwright proven in CI |
| 5 | Bridge / RWA | Experimental / skeleton |
| 6 | OpenAPI / Docker | Files present — maintain |
| 7 | Supernova alignment | **Mainnet 600 ms live (J+5)** · chainTiming default post-date + probe |

## Production checklist (project’s own bar)

- [ ] LIA ≥1 live trade/day without breaker — **no**  
- [ ] Marketplace list+buy E2E on-chain — **no**  
- [ ] PWA Lighthouse ≥90 — verify  
- [ ] E2E green in CI — **no** (do not advertise)  
- [ ] Bridge blackbox — no  
- [ ] OpenAPI + Docker — partial  
- [x] Supernova mainnet 600 ms — **network live 10 Sep 2026** (app polls aligned 15 Sep)

## Next engineering (not marketing)

1. SC deploy + verify → update `contracts.json`  
2. LIA executor implementation behind flags  
3. Wire or drop GSN / ContrarianBrain mentions  
4. Single Pages workflow (`static.yml`)  
5. Fund LIA Ops + treasury dest wallets  
6. Observe epoch 2238 rewards-claim fix (15 Sep ~18:05 UTC)  
