import { useEffect, useState, type ReactNode } from 'react'
import { sdkDappConfig } from '../config/sdkDapp'
import { bootstrapSendTx } from './bootstrapSendTx'

type Props = { children: ReactNode }

/**
 * Mounts MultiversX sdk-dapp DappProvider when the package resolves (Vite ESM).
 * Falls back to children-only if import fails (build/Pages still works).
 */
export function MxDappProvider({ children }: Props) {
  const [Provider, setProvider] = useState<React.ComponentType<Record<string, unknown>> | null>(
    null
  )

  useEffect(() => {
    bootstrapSendTx()
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mod = await import(/* @vite-ignore */ '@multiversx/sdk-dapp/wrappers/DappProvider')
        const C = (mod as { DappProvider?: React.ComponentType<Record<string, unknown>> }).DappProvider
        if (!cancelled && C) setProvider(() => C)
      } catch {
        try {
          const mod = await import(/* @vite-ignore */ '@multiversx/sdk-dapp')
          const C = (mod as { DappProvider?: React.ComponentType<Record<string, unknown>> }).DappProvider
          if (!cancelled && C) setProvider(() => C)
        } catch {
          /* optional */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!Provider) return <>{children}</>

  return (
    <Provider
      environment={sdkDappConfig.environment}
      customNetworkConfig={sdkDappConfig.customNetworkConfig}
      dappConfig={sdkDappConfig.dappConfig}
    >
      {children}
    </Provider>
  )
}

export default MxDappProvider
