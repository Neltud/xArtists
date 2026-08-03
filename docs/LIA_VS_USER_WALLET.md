# Dashboard LIA vs wallet utilisateur

## En une phrase

| Vue | Adresse scannée | Signification |
|-----|-----------------|---------------|
| **Dashboard / Portfolio / Board (défaut)** | **Wallet LIA** (protocole) | Performance & trésorerie de l’agent ops |
| **Wallet page mode User** | **Adresse Connect** | Ton solde personnel |
| **Wallet page mode LIA** | Wallet LIA | Même trésorerie protocole (lecture) |

## Wallet LIA (protocole)

```
erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6
```

- Propriétaire des SC (après deploy)
- Reçoit `claimFees`
- Exécute trades Vellum (PEM secret)
- **Ne se connecte jamais** via le bouton Connect de la dApp

## Wallet utilisateur

- Obtenu via Connect (xPortal / extension / Web)
- Signe List / Buy / Bid / Buy agent
- Ne doit **jamais** être confondu avec LIA

## UX

- Dashboard : bandeau « vue protocole LIA »
- Wallet : bascule **Mon wallet** | **Wallet LIA (ops)**
- MoonPay sur page Wallet en mode LIA = recharge **protocole** (attention)
