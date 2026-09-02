import type { ComponentType, ReactNode } from 'react'
import { sdkDappConfig } from '../config/sdkDapp'

type Props = { children: ReactNode }

/**
 * Attempts to mount official @multiversx/sdk-dapp DappProvider.
 * Falls back to children-only if package/API not available (build never crashes).
 */
export function MxDappProvider({ children }: Props) {
  try {
    // Vite / ESM: static import paths vary by sdk-dapp major — try common ones via require-style dynamic
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    let DappProvider: ComponentType<Record<string, unknown>> | undefined

    try {
      // @ts-ignore optional dependency resolved at runtime
      DappProvider = require('@multiversx/sdk-dapp/wrappers/DappProvider').DappProvider
    } catch {
      try {
        // @ts-ignore optional dependency resolved at runtime
        DappProvider = require('@multiversx/sdk-dapp').DappProvider
      } catch {
        DappProvider = undefined
      }
    }

    if (!DappProvider) {
      return <>{children}</>
    }

    return (
      <DappProvider
        environment={sdkDappConfig.environment}
        customNetworkConfig={sdkDappConfig.customNetworkConfig}
        dappConfig={sdkDappConfig.dappConfig}
      >
        {children}
      </DappProvider>
    )
  } catch {
    return <>{children}</>
  }
}

export default MxDappProvider
