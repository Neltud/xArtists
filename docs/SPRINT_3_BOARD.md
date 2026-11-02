# Sprint 3 — Mainstream Live (board 2026-11-02 14:09 CET)

## Clôturé Sprint 2

| Item | Status |
|------|--------|
| PR **#258** mint dispatch hardening | **MERGED** → `main` (~3915946f) |
| dry_run default / payment flags / PG jobs / NFT snapshot / restore fail-closed | **ON main** |
| `mintDispatch.mjs` + hardened `mint-on-payment.yml` | **ON main** |
| LIA live trading | **OFF** |

## En cours (cette branche)

| Item | Status |
|------|--------|
| `feat/mainstream-live-mint-wire` @ `6abbc56a+` | IPN → `triggerMintDispatchSafe` |
| `docs/LIVE_MAINNET_OPERATOR.md` | Sur branche, **pas encore sur main** |
| PR wire → main | À ouvrir / merger |

## On-chain (re-vérifié)

| Ressource | Valeur |
|-----------|--------|
| Deployer EGLD | **0.005342** |
| SC prices | Pulse **1** · Yield **5** · Sentinel **2.5** |
| Rule1 cible | 33 / 22.5 / 15 |
| Live catalogue | **NO-GO liquidité** |
| Live micro | **GO technique** si PEM + buyer |

## Sprint 3 — objectifs (ordre)

### P0 — Merge & deploy wire
1. Merger **feat/mainstream-live-mint-wire** → main
2. Déployer access-api avec env:
   - `MINT_DISPATCH_ENABLED=1`
   - `MINT_DRY_RUN=1` (rester dry jusqu’à GO humain)
   - `MINT_LIVE_ENABLED=0`
   - `MINT_GITHUB_PAT` (workflow)
   - `DATABASE_URL` (idempotence multi-instance)
3. Vérifier `/health` : `mint_dispatch_enabled`, `mint_dry_run=true`

### P0 — Premier mint mainnet (humain)
4. Confirmer `SC_DEPLOYER_PEM` production (UI only)
5. Buyer `erd1` validé
6. Actions **Mint on payment** :
   - `pack=sentinel`
   - `live_mint=true`
   - `confirm=LIVE_MINT_MAINNET`
   - `micro_price=true`
7. Explorer : NFT sur buyer + prix SC restaurés Rule1

### P1 — Commercial path
8. S1 paiement réel PayBox (Sentinel 50€)
9. S2 My Packs prouve NFT on-chain
10. Whop TCA Membership `prod_` (services only, no Genesis)
11. Option : top-up deployer ≥20 EGLD → abandon micro path

### P1 — Product mainstream
12. Pages `/packs/:id` + GenesisCard3D stable post-deploy
13. Align catalogue UI Rule1 EGLD anchors
14. Release Please **#257** (0.128.0) après wire merge si changelog OK

### P2 — Non-bloquant
15. Sync `package-lock` Playwright (npm ci dur)
16. E2E soft → hard uniquement après smoke Pages vert
17. Aligner prix SC on-chain → Rule1 (tx admin, post-funding)

## Hors scope Sprint 3
- LIA `LIVE_TRADING=1`
- Dropship / physical escrow P1+
- Dependabot majors

## Décision actuelle

| Gate | Verdict |
|------|---------|
| Code hardening | **GO** (merged) |
| Wire IPN→mint | **GO merge** branche |
| Live chain mint | **NO-GO auto** / **GO manuel** micro si PEM+buyer |
| Commercial public | **NO-GO** jusqu’à S1+S2 |
| LIA trading | **NO-GO** |

## Owners actions (humain)

```
[ ] Submit/merge PR wire
[ ] PEM confirmed
[ ] erd1 buyer
[ ] Optional: fund deployer
[ ] First micro mint Sentinel
```
