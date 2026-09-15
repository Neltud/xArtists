# SC deploy checklist (chantier séparé)

**Not demo marketing.** Do this only when ready to put wasm on mainnet.

## Before deploy

- [ ] Wasm audited / reviewed
- [ ] Owner / upgrade policy decided
- [ ] Gas + EGLD on deployer wallet
- [ ] `LIA_LIVE_TRADING=0` until post-verify QA

## Per contract

For each of: `nft_staking`, `tro_governance`, `marketplace`, `nft_minter`, …

1. Deploy via mxpy / release pipeline  
2. `curl -s https://api.multiversx.com/accounts/$ADDR | jq .codeHash` → **must be non-null**  
3. Update `data/contracts.json`:
   - `deploy_status.<name> = "DEPLOYED"`
   - `ui_status` only after product gate  
4. Explorer link in `DEPLOYMENT_LOG.md`  
5. Frontend: integrity gate must pass `assertLiveContract`

## After all core SCs

- [ ] One marketplace list+buy test TX  
- [ ] Update `docs/SOURCE_OF_TRUTH.md`  
- [ ] Only then consider wording beyond GO_DEMO  

Empty account with a reserved address ≠ deployed.
