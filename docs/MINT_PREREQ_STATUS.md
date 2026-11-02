# Mint live — audit prérequis (refresh 2026-11-02 13:30 CET)

## On-chain (re-vérifié)

| Wallet | EGLD | Pack NFTs |
|--------|------|-----------|
| **Deployer / SC owner** `erd1kex0…vl8v0g` | **0.005342** | Pulse-03, Pulse-04 |
| Admin `erd1mmh2…nucj5l` | 0.136 | 0 |
| LIA `erd1p4zy…0crn6` | 0.908 | 0 |
| **Total liquide ops** | **~1.05 EGLD** | — |

| SC pack price | On-chain | Rule1 cible |
|---------------|----------|-------------|
| Pulse | **1.0** EGLD | 33 |
| Yield | **5.0** EGLD | 22.5 |
| Sentinel | **2.5** EGLD | 15 |

## Secret PEM

`SC_DEPLOYER_PEM` sur environment **production** : **non lisible via API**. Confirmer dans GitHub UI.

## Décision ops

| Mode | Viable maintenant ? |
|------|---------------------|
| buyPack **Rule1** (15–33 EGLD) | ❌ non — financer deployer |
| buyPack **micro 0.001** + restore Rule1 | ✅ si PEM présent + ≥0.05 EGLD gas |
| Transfert Pulse-03/04 existants → buyer | ✅ via même PEM (manuel mxpy / workflow admin) |

## Funding plan (Rule1 catalogue)

1. Envoyer **≥ 20 EGLD** (Sentinel) ou **≥ 40 EGLD** (Pulse) vers `erd1kex0…vl8v0g`
2. Lancer mint-on-payment avec `micro_price=false`
3. Ou garder `micro_price=true` pour ops / tests jusqu’au top-up

Consolider LIA+admin → deployer ne suffit **pas** pour Rule1 (~1 EGLD).

## IPN → mint

Module : `services/access-api/src/mintDispatch.mjs`

```
MINT_DISPATCH_ENABLED=1
MINT_GITHUB_PAT=<pat workflow>
MINT_MICRO_PRICE=true   # default underfunded
```

Appeler `maybeDispatchMintAfterPaid(order)` après IPN `paid` / `server_confirmed` (ne jamais faire échouer le 200 IPN).

## Dispatch manuel (maintenant)

Actions → **Mint on payment** :

- live_mint=**true**
- confirm=**LIVE_MINT_MAINNET**
- micro_price=**true**
- buyer=`erd1…`
- pack=`sentinel`|`pulse`|`yield`
