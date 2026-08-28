/**
 * Live connect helpers — Web Wallet (redirect), xPortal, extension, session.
 */
import { useCallback, useMemo } from 'react'
import { useWallet, LIA_WALLET, isValidErd } from '../context/WalletContext'
import { DAPP_CALLBACK_BASE, XPORTAL_DEEP_LINKS, sdkDappConfig } from '../config/sdkDapp'

/** Callback must land on Pages origin so ?address= is readable (search, not only hash). */
export function buildWebWalletLoginUrl(): string {
  const callback = encodeURIComponent(`${DAPP_CALLBACK_BASE}/`)
  return `https://wallet.multiversx.com/hook/login?callbackUrl=${callback}`
}

export function useMxLogin() {
  const wallet = useWallet()

  const openWebWallet = useCallback(() => {
    window.location.href = buildWebWalletLoginUrl()
  }, [])

  const openXPortalDeepLink = useCallback(() => {
    window.open(XPORTAL_DEEP_LINKS.storeAndOpen, '_blank', 'noopener,noreferrer')
  }, [])

  const openXPortalNative = useCallback(() => {
    window.location.href = XPORTAL_DEEP_LINKS.nativeScheme
  }, [])

  const tryExtension = useCallback(async () => {
    const w = window as unknown as {
      elrondWallet?: { getAddress?: () => Promise<string> }
      multiversxWallet?: { getAddress?: () => Promise<string> }
    }
    const provider = w.elrondWallet || w.multiversxWallet
    if (!provider?.getAddress) {
      return { ok: false as const, error: 'Extension MultiversX DeFi Wallet non détectée.' }
    }
    try {
      const addr = await provider.getAddress()
      if (!isValidErd(addr)) return { ok: false as const, error: 'Adresse extension invalide' }
      return wallet.connect(addr, 'defi_wallet')
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : 'Erreur extension',
      }
    }
  }, [wallet])

  const projectId = sdkDappConfig.walletConnectV2ProjectId

  const status = useMemo(
    () => ({
      connected: wallet.connected,
      address: wallet.address,
      shortAddress: wallet.shortAddress,
      method: wallet.method,
      canAttemptSign: wallet.canAttemptSign,
      isLiaBlocked: wallet.address?.toLowerCase() === LIA_WALLET.toLowerCase(),
      wcProjectId: projectId,
    }),
    [wallet, projectId]
  )

  return {
    ...status,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    openWebWallet,
    openXPortalDeepLink,
    openXPortalNative,
    tryExtension,
  }
}
