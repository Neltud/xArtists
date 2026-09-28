# Deploy venue-split via GitHub Actions

## Prérequis

1. Repository secret **`SC_DEPLOYER_PEM`** (contenu PEM du deployer financé)
2. Deployer mainnet ≥ ~0.05 EGLD si chain=1
3. Buckets (defaults déjà dans le workflow) :

| Bucket | Address |
|--------|---------|
| Institution 40% | `erd1hurlzgn2sq8sswdksv7ewtp6vs9umdakcpef5nfxkmt7mpxsyumsywtva6` |
| Associations 20% | `erd1cwp2m53pnem5p35vsdc2mcry6779eawq9h4ty2a4nnsp8ewknrjs55yxcd` |
| LIA 25% | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` |
| Holders 15% | `erd1qpvy7z9jchrvxcu0c9z3w083am6n5j7nae8u0cvaanesa36a839qcgj5fz` |

## Lancer

1. GitHub → **Actions** → **Deploy venue-split** → **Run workflow**
2. **Première fois : `chain = D` (devnet)** — tester build + deploy sans mainnet
3. Mainnet : `chain = 1` + `confirm_mainnet = DEPLOY_MAINNET`

## Après succès

```bash
export VENUE_SC_ADDRESS=<adresse du log CI>
export CHAIN=mainnet   # ou devnet
./scripts/verify_venue_codehash.sh
./scripts/rentpay_micro_test.sh
```

Puis secrets Pages :

- `VITE_VENUE_SC_ADDRESS`
- `VITE_VENUE_CODEHASH_OK=1` **uniquement si codeHash OK**

**Jamais** d’annonce publique avant verify.
