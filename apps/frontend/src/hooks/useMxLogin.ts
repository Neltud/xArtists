/**
 * Connection hooks — bridges WalletContext + optional sdk-dapp login info
 */
import { useCallback, useMemo } from 'react'
import { useWallet, LIA_WALLET } from '../context/WalletContext'
import { DAPP_CALLBACK_BASE, XPORTAL_DEEP_LINKS, sdkDappConfig } from '../config/sdkDapp'

export function useMxLogin() {
  const wallet = useWallet()

  const openWebWallet = useCallback(() => {
    const callback = encodeURIComponent(`${DAPP_CALLBACK_BASE}/`)
    window.location.href = `https://wallet.multiversx.com/hook/login?callbackUrl=${callback}`
  }, [])

  const openXPortalDeepLink = useCallback(() => {
    window.open(XPORTAL_DEEP_LINKS.storeAndOpen, '_blank', 'noopener,noreferrer')
  }, [])

  const openXPortalNative = useCallback(() => {
    window.location.href = XPORTAL_DEEP_LINKS.nativeScheme
  }, [])

  const projectId = sdkDappConfig.walletConnectV2ProjectId

  const status = useMemo(
    () => ({
      connected: wallet.connected,
      address: wallet.address,
      shortAddress: wallet.shortAddress,
      method: wallet.method,
      isLiaBlocked: wallet.address?.toLowerCase() === LIA_WALLET.toLowerCase(),
      wcProjectId: projectId,
    }),
    [wallet, projectId],
  )

  return {
    ...status,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    openWebWallet,
    openXPortalDeepLink,
    openXPortalNative,
  }
}
