/**
 * TX shell — optional MultiversX DappProvider.
 * Avoid static/dynamic sdk-dapp imports in the main bundle (Ledger BLE breaks Vite 5).
 * Signing routes still work via Web Wallet redirect / extension hooks in the app.
 */
import type { ReactNode } from 'react'

export default function TxShell({ children }: { children: ReactNode }) {
  return <>{children}</>
}
