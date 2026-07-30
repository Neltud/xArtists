# @multiversx/sdk-dapp — installation xArtists

## Packages (apps/frontend/package.json)

```bash
cd apps/frontend
npm install
# installs:
#   @multiversx/sdk-dapp
#   @multiversx/sdk-core
#   @multiversx/sdk-network-providers
```

WalletConnect Project ID (already in config):

```
e07ac8e2a212711609b21dade4c9e37f
```

Env (optional override):

```env
VITE_WALLETCONNECT_PROJECT_ID=e07ac8e2a212711609b21dade4c9e37f
```

## Wire DappProvider (after green deploy)

In `main.tsx`:

```tsx
import { MxDappProvider } from './providers/MxDappProvider'

<MxDappProvider>
  <BrowserRouter basename="/xArtists">
    <WalletProvider>
      <MultiversXProvider>
        <App />
      </MultiversXProvider>
    </WalletProvider>
  </BrowserRouter>
</MxDappProvider>
```

## Official login buttons (replace Header modal gradually)

```tsx
import {
  ExtensionLoginButton,
  WalletConnectLoginButton,
  WebWalletLoginButton,
} from '@multiversx/sdk-dapp/UI'
```

(Exact export paths depend on sdk-dapp major version — check node_modules after install.)

## Note

Current production connect path = Web Wallet redirect + address guard (no LIA mock).
sdk-dapp enables full xPortal **QR** WalletConnect.
