# User wallet integration — xArtists

## What is integrated

| Layer | Behavior |
|-------|----------|
| **Connect** | Web Wallet redirect, DeFi extension `getAddress`, xPortal deep link, paste **read-only** |
| **Reject** | LIA protocol address never as user session |
| **Persist** | `localStorage` `xartists_wallet` |
| **Callback** | `?address=` / `loginAddress` from MultiversX web wallet → method `web_wallet` |
| **Account** | `useUserAccount` → API `/accounts/{erd1}` balance + nonce + shard + NFTs |
| **Tokens** | `useWalletTokens` → ESDT / Hatom / LP for **connected** address only |
| **Sign** | TxShell on Market/Studio/Wallet/… injects `__xartistsSendTx` |
| **Block** | paste_readonly, LIA ops, missing send helper |

## Open Connect from any page

```ts
import { requestOpenConnect } from '../lib/walletEvents'
requestOpenConnect() // Header opens modal
```

## Not the same as LIA

| | User `/wallet` | Protocol `/portfolio` |
|--|----------------|------------------------|
| Address | Connect session | LIA ops fixed |
| TX List/Buy | Yes if sign + SC live | Never as user session |
| Purpose | Your assets | Protocol dashboard |

## Limits (honest)

- Full WalletConnect QR still best via Web Wallet path until sdk-dapp LoginButton is wired end-to-end.
- Extension `signTransaction` varies by version; prefer Web Wallet for reliable mainnet TX.
- SC still gated by codeHash — Connect alone does not enable Buy.
