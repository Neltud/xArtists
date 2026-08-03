import { useEffect, type ReactNode } from 'react'
import { sdkDappConfig } from '../config/sdkDapp'
import { bootstrapSendTx } from './bootstrapSendTx'

type Props = { children: ReactNode }

/**
 * Mount sdk-dapp DappProvider when available + always bootstrap __xartistsSendTx.
 */
export function MxDappProvider({ children }: Props) {
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

export default MxDappProvider
