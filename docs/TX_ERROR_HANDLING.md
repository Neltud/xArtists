# Gestion des erreurs de transaction

## Modules

| Fichier | Rôle |
|---------|------|
| `src/services/txErrors.ts` | Classification, preflight, poll status |
| `src/hooks/useSendTx.ts` | Envoi sdk-dapp + phases |
| `src/components/TxStatusBanner.tsx` | Feedback UI |
| `src/hooks/useAgentsMarketplace.ts` | List/Buy/Cancel + errors |

## Codes

| Code | Signification | Retry |
|------|---------------|-------|
| `USER_REJECTED` | Refus signature wallet | oui |
| `INSUFFICIENT_FUNDS` | EGLD + gas | oui |
| `INSUFFICIENT_GAS` | Gas limit | oui |
| `WRONG_NONCE` | Nonce stale | oui |
| `CONTRACT_ERROR` | SC require! / return | non |
| `TIMEOUT` | Poll explorer | oui (check explorer) |
| `NETWORK` | API/gateway | oui |
| `NOT_CONFIGURED` | Adresse SC manquante | non |
| `NOT_LOGGED_IN` | Wallet | oui |

## Phases

`idle → building → signing → broadcasting → pending → success | failed | cancelled`

## Usage

```tsx
const { listAgent, txState, lastError, resetTx } = useAgentsMarketplace()
const built = await listAgent(addr, nonce, params, { isLoggedIn: true, autoSend: true })
// <TxStatusBanner state={txState} onDismiss={resetTx} />
```

Messages SC mappés : `listing inactive`, `insufficient payment`, `only seller`, etc.
