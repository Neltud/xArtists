import { useEffect, type ReactNode } from 'react'
import { sdkDappConfig } from '../config/sdkDapp'
import { bootstrapSendTx } from './bootstrapSendTx'

/**
 * Lazy-loaded only on TX-capable routes (Market, Studio, Agents, Tip, Wallet, Staking).
 * Keeps @multiversx/sdk-dapp out of the initial Home/Gallery/Portfolio bundle.
 */
export default function TxShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    bootstrapSendTx()
  }, [])

  try {
    let DappProvider: React.ComponentType<Record<string, unknown>> | undefined
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      DappProvider = require('@multiversx/sdk-dapp/wrappers/DappProvider').DappProvider
    } catch {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
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
