import React, { useEffect, useState } from 'react'
import './WalletModal.css'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * Login modal: xPortal (WalletConnect V2), DeFi Wallet extension, Web Wallet
 * Uses @multiversx/sdk-dapp hooks when available; graceful fallback messages.
 */
const WalletModal: React.FC<Props> = ({ open, onClose }) => {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setError(null)
      setBusy(null)
    }
  }, [open])

  if (!open) return null

  const runLogin = async (method: 'xportal' | 'extension' | 'web') => {
    setError(null)
    setBusy(method)
    try {
      if (method === 'extension') {
        const { useExtensionLogin } =
          await import('@multiversx/sdk-dapp/hooks/login/useExtensionLogin')
        // hooks can't be called here — use login services instead
      }

      if (method === 'xportal') {
        const mod = await import('@multiversx/sdk-dapp/hooks/login/useWalletConnectV2Login')
        // Prefer imperative login from services
      }

      // Imperative login helpers (sdk-dapp v2/v3 patterns)
      const services = await import('@multiversx/sdk-dapp/services')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = services as any

      if (method === 'extension') {
        if (typeof s.extensionLogin === 'function') {
          await s.extensionLogin({ callbackRoute: window.location.pathname })
        } else if (typeof s.login === 'function') {
          await s.login({ provider: 'extension' })
        } else {
          // Fallback: trigger native extension if injected
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const provider = (window as any).elrondWallet || (window as any).multiversxWallet
          if (provider?.login) {
            await provider.login()
          } else {
            throw new Error(
              'Extension MultiversX DeFi Wallet introuvable. Installe-la puis réessaie.'
            )
          }
        }
        onClose()
        return
      }

      if (method === 'xportal') {
        // WalletConnect V2 → xPortal mobile
        if (typeof s.walletConnectV2Login === 'function') {
          await s.walletConnectV2Login({
            callbackRoute: window.location.pathname,
            logoutRoute: window.location.pathname,
          })
        } else if (typeof s.login === 'function') {
          await s.login({ provider: 'walletConnectV2' })
        } else {
          // Event for app-level WC pair flow
          window.dispatchEvent(new CustomEvent('mvx:login-walletconnect'))
          setError(
            'xPortal / WalletConnect : pair via le flux sdk-dapp (QR). Vérifie VITE_WALLETCONNECT_PROJECT_ID.'
          )
          return
        }
        onClose()
        return
      }

      if (method === 'web') {
        if (typeof s.webWalletLogin === 'function') {
          await s.webWalletLogin({
            callbackRoute: window.location.pathname,
          })
        } else if (typeof s.login === 'function') {
          await s.login({ provider: 'webwallet' })
        } else {
          // Redirect to official web wallet with callback
          const callback = encodeURIComponent(window.location.href)
          window.location.href = `https://wallet.multiversx.com/hook/login?callbackUrl=${callback}`
          return
        }
        onClose()
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="wm-backdrop" role="dialog" aria-modal="true" aria-label="Connecter un wallet">
      <div className="wm-panel">
        <header className="wm-head">
          <h2>Connecter un wallet</h2>
          <button type="button" className="wm-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>
        <p className="wm-sub">MultiversX mainnet — xPortal, DeFi Wallet, Web Wallet</p>
        <div className="wm-options">
          <button
            type="button"
            className="wm-opt"
            disabled={!!busy}
            onClick={() => void runLogin('xportal')}
          >
            <span className="wm-icon">📱</span>
            <span>
              <strong>xPortal</strong>
              <small>WalletConnect v2 · mobile</small>
            </span>
            {busy === 'xportal' && <span className="wm-spin">…</span>}
          </button>
          <button
            type="button"
            className="wm-opt"
            disabled={!!busy}
            onClick={() => void runLogin('extension')}
          >
            <span className="wm-icon">🧩</span>
            <span>
              <strong>DeFi Wallet</strong>
              <small>Extension navigateur</small>
            </span>
            {busy === 'extension' && <span className="wm-spin">…</span>}
          </button>
          <button
            type="button"
            className="wm-opt"
            disabled={!!busy}
            onClick={() => void runLogin('web')}
          >
            <span className="wm-icon">🌐</span>
            <span>
              <strong>Web Wallet</strong>
              <small>wallet.multiversx.com</small>
            </span>
            {busy === 'web' && <span className="wm-spin">…</span>}
          </button>
        </div>
        {error && <p className="wm-error">{error}</p>}
        <p className="wm-note">
          Le bouton <em>Lancer le cycle LIA</em> n’apparaît que si le wallet{' '}
          <strong>LIA ops</strong> est connecté.
        </p>
      </div>
    </div>
  )
}

export default WalletModal
