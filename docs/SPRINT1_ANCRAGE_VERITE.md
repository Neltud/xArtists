# Sprint 1 — L’Ancrage de la Vérité

## Livrables (Vite `apps/frontend`, pas Next.js)

| Mission | Fichier |
|---------|--------|
| 1 Doctrine | `src/core/doctrine.ts` |
| 2 MultiversX service | `src/services/multiversXService.ts` |
| 3 Intent schema | `src/types/intent.ts` |
| 4 Hook UI | `src/hooks/useLIA.ts` |

## Principes

- **LIA** = intelligence / commandes (intent → doctrine → service).
- **$TRO** = actif économique (mint/burn/stake policy séparée — pas mélangé dans Doctrine swap).
- **Wallet** = MultiversX (xPortal / WC / DeFi Wallet) via sdk-dapp existant — pas MetaMask comme rail principal.
- **Paper par défaut.** Live seulement si `VITE_LIA_LIVE_TRADING=1` **et** `userConfirmedLive` **et** doctrine OK **et** `signAndSend` wallet.

## Workflow

```
NL / CommandBar → parseNaturalToIntent → validateIntent (Doctrine)
  → MultiversXService.executeIntent
      → paper success  ou  signAndSend → broadcast
```

## Test rapport

| Cas | Attendu |
|-----|--------|
| `runNatural("solde")` | Intent BALANCE_QUERY · paper OK |
| Transfer sans erd1 | rejected MISSING_TARGET |
| amount float string | rejected AMOUNT_NOT_ATOMIC (parser convertit human→atomic) |
| Live sans env | reste paper |
| Live + env + signAndSend | broadcast + txHash |

## Suite Sprint 2

- Brancher `signAndSend` réel sur TxShell / sdk-dapp `sendTransactions`
- IntentBar appelle `useLIA().runNatural`
- Micro-tip EGLD mainnet avec wallet user
