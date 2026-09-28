# Micro rentPay dust — venue-split mainnet

**SC** : `erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y`  
**Ne pas** activer `VITE_VENUE_CODEHASH_OK` avant succès + codeHash explorer = build.

## Depuis xPortal (recommandé)

1. Ouvre xPortal → Send / Contract interaction  
2. Address : `erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y`  
3. Endpoint : `rentPay`  
4. Args : `tier_id` = string `dust` (ManagedBuffer UTF-8)  
5. Value : **0.001 EGLD** (dust)  
6. Gas : ~10_000_000  
7. Sign & send  

## Vérifs post-tx

Explorer SC → Transactions : status **success**.  
Balances buckets doivent recevoir le split 40/20/25/15 :

| Bucket | Address |
|--------|---------|
| Institution | `erd1hurlzgn2sq8sswdksv7ewtp6vs9umdakcpef5nfxkmt7mpxsyumsywtva6` |
| Associations | `erd1cwp2m53pnem5p35vsdc2mcry6779eawq9h4ty2a4nnsp8ewknrjs55yxcd` |
| LIA | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` |
| Holders | `erd1qpvy7z9jchrvxcu0c9z3w083am6n5j7nae8u0cvaanesa36a839qcgj5fz` |

codeHash attendu : `SRrGio4iLmtQrb22JJhapwobNgavYsoQ52WmfT1owuY=`

## Ensuite

Pages secrets :

```
VITE_VENUE_SC_ADDRESS=erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y
VITE_VENUE_CODEHASH_OK=1
```

Rebuild Pages. Puis packaging wasm marketplaces.
