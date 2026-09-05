# Checklist durcissement — à cocher avant fonds réels

## Secrets

- [ ] Aucun `.pem` dans git (`git ls-files '*.pem'`)
- [ ] `LIA_WALLET_PEM` uniquement GH Actions + Vellum
- [ ] Rotate PEM si exposé une fois
- [ ] Deployer wallet ≠ cold treasury

## Contrats

- [ ] Devnet deploy + blackbox list/buy/cancel/claimFees
- [ ] Mainnet deploy → `python scripts/verify_marketplace_codehash.py` exit 0
- [ ] `data/contracts.json` mis à jour **après** verify
- [ ] UI Buy désactivé si `assertLiveContract` fail
- [ ] Pause testée (owner)
- [ ] Non-owner claimFees revert (test)

## Front

- [ ] `DEMO_MODE=true` jusqu’au GO CEO
- [ ] `integrityGates.assertUserFundMove` sur paths Buy/List
- [ ] WalletConnect domain = Pages only
- [ ] Pas de `dangerouslySetInnerHTML` sur input user
- [ ] Amounts en string atomique / BigInt

## LIA

- [ ] `LIA_LIVE_TRADING=0` default
- [ ] Micro-proof avant live
- [ ] Halt après N failures

## Post Supernova (epoch 2233+)

- [ ] Login WC + lecture compte
- [ ] Timeouts TX revus (`docs/SUPERNOVA_TIMEOUTS.md`)

## Audit externe

- [ ] Cabinet indépendant avant TVL matériel
