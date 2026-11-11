/**
 * Live connect — Web Wallet (recommandé), xPortal WC mainnet, extension.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { useWallet, LIA_WALLET, isValidErd } from '../context/WalletContext'
import { DAPP_CALLBACK_BASE, sdkDappConfig } from '../config/sdkDapp'
import { loginWithXPortalMainnet, cancelXPortalLogin, type XPortalLoginProgress } from '../lib/xportalWc'

export function buildWebWalletLoginUrl(): string {
  const callback = encodeURIComponent(`${DAPP_CALLBACK_BASE}/`)
  return `https://wallet.multiversx.com/hook/login?callbackUrl=${callback}`
}

export function useMxLogin() {
  const wallet = useWallet()
  const [wcProgress, setWcProgress] = useState<XPortalLoginProgress | null>(null)
  // Ignore late WalletConnect results when the user cancels or closes the panel.
  const attempt = useRef(0)
  // Only this hook's own in-flight request may be cancelled on unmount.
  // LoginModal uses the same global WC client, but owns a separate attempt.
  const activeAttempt = useRef<number | null>(null)

  const cancelXPortal = useCallback(() => {
    if (activeAttempt.current === null) return
    activeAttempt.current = null
    attempt.current++
    cancelXPortalLogin()
    setWcProgress(null)
  }, [])

  const openWebWallet = useCallback(() => {
    window.location.href = buildWebWalletLoginUrl()
  }, [])

  const connectXPortal = useCallback(async () => {
    const id = ++attempt.current
    activeAttempt.current = id
    setWcProgress({ phase: 'init', message: 'Connexion xPortal mainnet…' })
    let res: Awaited<ReturnType<typeof loginWithXPortalMainnet>>
    try {
      res = await loginWithXPortalMainnet(p => {
        if (attempt.current === id) setWcProgress(p)
      })
    } catch {
      // The SDK normally returns an error object; keep unexpected exceptions fail-closed.
      res = { ok: false, error: 'WalletConnect indisponible. Réessaie.' }
    } finally {
      if (activeAttempt.current === id) activeAttempt.current = null
    }
    // An approval arriving after an explicit cancellation must not attach a wallet.
    if (attempt.current !== id) return { ok: false as const, error: 'Connexion annulée.' }
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
    cancelXPortal,
    tryExtension,
    clearWcProgress: () => setWcProgress(null),
  }
}
