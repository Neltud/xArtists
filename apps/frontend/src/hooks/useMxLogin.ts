/**
 * Live connect — Web Wallet (recommandé), xPortal WC mainnet, extension.
 */
import { useCallback, useMemo, useState } from 'react'
import { useWallet, LIA_WALLET, isValidErd } from '../context/WalletContext'
import { DAPP_CALLBACK_BASE, sdkDappConfig } from '../config/sdkDapp'
import { loginWithXPortalMainnet, type XPortalLoginProgress } from '../lib/xportalWc'

export function buildWebWalletLoginUrl(): string {
  const callback = encodeURIComponent(`${DAPP_CALLBACK_BASE}/`)
  return `https://wallet.multiversx.com/hook/login?callbackUrl=${callback}`
}

export function useMxLogin() {
  const wallet = useWallet()
  const [wcProgress, setWcProgress] = useState<XPortalLoginProgress | null>(null)

  const openWebWallet = useCallback(() => {
    window.location.href = buildWebWalletLoginUrl()
  }, [])

  const connectXPortal = useCallback(async () => {
    setWcProgress({ phase: 'init', message: 'Connexion xPortal mainnet…' })
    const res = await loginWithXPortalMainnet(p => setWcProgress(p))
    if (!res.ok) {
      setWcProgress({ phase: 'error', message: res.error })
      return res
    }
    const linked = wallet.connect(res.address, 'xportal')
    if (!linked.ok) {
      setWcProgress({ phase: 'error', message: linked.error })
      return { ok: false as const, error: linked.error || 'Échec session' }
    }
    setWcProgress({ phase: 'done', message: res.address })
    return { ok: true as const, address: res.address }
  }, [wallet])

  /** @deprecated deep link seul — préfère connectXPortal */
  const openXPortalDeepLink = useCallback(() => {
    void connectXPortal()
  }, [connectXPortal])

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
      wcProgress,
    }),
    [wallet, projectId, wcProgress],
  )

  return {
    ...status,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    openWebWallet,
    openXPortalDeepLink,
    connectXPortal,
    tryExtension,
    clearWcProgress: () => setWcProgress(null),
  }
}
