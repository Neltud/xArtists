/**
 * Optional MultiversX sdk-dapp provider.
 * Wire in main.tsx after confirming build with installed packages:
 *
 *   import { MxDappProvider } from './providers/MxDappProvider'
 *   <MxDappProvider><App /></MxDappProvider>
 *
 * Until then, WalletContext + Web Wallet redirect remains the production path.
 */

import type { ReactNode } from 'react'
import { sdkDappConfig } from '../config/sdkDapp'

type Props = { children: ReactNode }

/**
 * Thin wrapper — imports sdk-dapp dynamically-friendly structure.
 * If DappProvider API differs by major version, adjust imports here only.
 */
export function MxDappProvider({ children }: Props) {
  // Lazy static import pattern: build must resolve @multiversx/sdk-dapp
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try {
    // Prefer named export used by sdk-dapp v2/v3 templates
    // @ts-expect-error resolved at install time
    const mod = require('@multiversx/sdk-dapp/wrappers/DappProvider') as {
      DappProvider?: React.ComponentType<Record<string, unknown>>
    }
    const DappProvider = mod?.DappProvider
    if (!DappProvider) {
      return <>{children}</>
    }
    return (
      <DappProvider
        environment={sdkDappConfig.environment}
        customNetworkConfig={sdkDappConfig.customNetworkConfig}
        dappConfig={{ name: 'xArtists' }}
      >
        {children}
      </DappProvider>
    )
  } catch {
    return <>{children}</>
  }
}

export default MxDappProvider
