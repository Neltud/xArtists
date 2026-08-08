import { useEffect, useState, type ReactNode, type ComponentType } from 'react'
import { sdkDappConfig } from '../config/sdkDapp'
import { bootstrapSendTx } from './bootstrapSendTx'

/**
 * Lazy TX shell — loads @multiversx/sdk-dapp only on signing routes.
 * Dynamic import (no require) so Vite can code-split cleanly.
 */
export default function TxShell({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<ComponentType<Record<string, unknown>> | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mod = await import('@multiversx/sdk-dapp/wrappers/DappProvider')
        if (!cancelled && mod.DappProvider) setProvider(() => mod.DappProvider as ComponentType<Record<string, unknown>>)
      } catch {
        try {
          const mod = await import('@multiversx/sdk-dapp')
          const DP = (mod as { DappProvider?: ComponentType<Record<string, unknown>> }).DappProvider
          if (!cancelled && DP) setProvider(() => DP)
        } catch {
          /* read-only mode */
        }
      }
      if (!cancelled) bootstrapSendTx()
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
