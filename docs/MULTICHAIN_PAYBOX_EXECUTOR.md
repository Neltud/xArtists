# Multichain Trading — LIA Brain → PayBox Executor

**Date:** 2026-10-17  
**Status:** LIVE path Solana (PayBox) · MultiversX reste paper / user-sign

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  LIA BRAIN (lia/brain/* · circuit · signals · guardian) │
│  Décision: BUY/SELL/HOLD · taille · chaîne · asset      │
└───────────────────────────┬─────────────────────────────┘
                            │ DecisionProof (JSON)
                            ▼
┌─────────────────────────────────────────────────────────┐
│  ROUTER multichain                                      │
│  · MultiversX → TxShell user / LIA PEM (paper until     │
│    go_live_gates + micro-proofs)                        │
│  · Solana / EVM → PayBox executor (ce module)           │
└───────────────────────────┬─────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     PayBox Solana                 PayBox EVM
     (credential sol-default)      (credential evm-default)
```

## 2. Doctrine (alignée dapp_sync)

| Règle | Valeur |
|-------|--------|
| Paper first sur MultiversX | `LIA_LIVE_TRADING=0` jusqu’à gates |
| PayBox = exécution **user-granted** | Credentials accordés à Grok, signature client-side |
| Fail closed | Pas de swap si solde insuffisant / route absente |
| Caps micro | Premier leg ≤ 50 % du SOL dispo, garder gas |
| Pas de PEM dans git | PayBox ne stocke pas de clé serveur |
| Journal | Chaque exécution → `data/paybox_legs.json` |

## 3. Chaînes supportées (PayBox)

| Chaîne | CAIP-2 | Rôle |
|--------|--------|------|
| Solana | `solana:mainnet` | Trading live immédiat (wallet financé) |
| EVM (Base, ETH, …) | `eip155:*` | Quand wallet EVM financé |
| MultiversX | — | **Hors PayBox** — xPortal / PEM vault |

## 4. Flux décision → exécution

1. **Brain** produit un intent :
   ```json
   {
     "action": "SWAP",
     "src_chain": "solana:mainnet",
     "src_token": "native",
     "dst_token": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
     "amount_atomic": "70000000",
     "reason": "BASE_USDC_FOR_TRADING",
     "confidence": 0.9,
     "max_slippage_bps": 100
   }
   ```
2. **Pretrade / Guardian** (optionnel côté LIA) valide taille et mode.
3. **PayBox** : `get_portfolio` → `request_swap` → poll `get_request` → journal.
4. **Post-trade** : MAJ portfolio + `paybox_legs.json` pour le dApp.

## 5. Wallets ops (session 2026-10-17)

| Credential | Adresse | Chaîne |
|------------|---------|--------|
| sol-default | `Dmc7RKdPNKcDDeGVW37rPnZZ7jJiPYuCmgB1EMBbRRFN` | Solana |
| evm-default | `0xc603c5b2013bcbc54238a6f7ca503992493f2e41` | EVM |

## 6. Premier leg (bootstrap)

- **Intent:** convertir une partie du SOL en USDC (base de trading stable).
- **Garder** ≥ 0.02 SOL pour les fees.
- **Ne pas** allumer le live MultiversX.

## 7. Modules code

| Fichier | Rôle |
|---------|------|
| `lia/executor/paybox_router.py` | Intent → payload PayBox + journal local |
| `docs/MULTICHAIN_PAYBOX_EXECUTOR.md` | Cette doctrine |
| `data/paybox_legs.json` | Historique des legs (publiable dApp) |

## 8. Interdits

- Router des fees MultiversX via PayBox
- Confondre wallet PayBox et deployer `erd1kex0p…`
- Swap 100 % du SOL (gas stuck)
- Live MultiversX sans `go_live_gates` + micro-proof user
