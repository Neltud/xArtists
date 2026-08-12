# LIA vs utilisateur — séparation obligatoire

| Qui | Adresse | Où dans la dApp | Peut signer List/Buy ? |
|-----|---------|-----------------|-------------------------|
| **User** | Wallet Connect (xPortal / DeFi / Web) | `/wallet`, Header Connect | Oui si method ≠ paste_readonly + sdk-dapp |
| **LIA Ops** | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` | `/portfolio`, Tip, Board, Trading paper | **Jamais** en session UI |
| **Paste erd1** | N’importe quelle erd1 collée | Session lecture seule | **Non** |
| **My Packs** | Access NFT → wallet user | `/my-packs` | Fiat→mint ; perf = paper LIA |

## Règles produit

1. Connecter le wallet **LIA protocole** en UI = **rejeté** (`WalletContext.connect`).
2. Portfolio = book **protocole** (EGLD/tokens/NFT LIA + BTC/SOL affichage).
3. Wallet = soldes de **l’adresse Connect** uniquement.
4. Trading / Board = signaux et paper **LIA**, pas le compte user.
5. Tips = dons vers **LIA Ops** (pas un investissement).
6. List/Buy/Bid = **user** seulement + `UserWalletGuard` + codeHash SC.

## Vellum / backend

- PEM LIA = exécution autonome **hors** session navigateur.
- `LIA_LIVE_TRADING=0` jusqu’aux micro-preuves.
- `operator_control` pause = human override.
