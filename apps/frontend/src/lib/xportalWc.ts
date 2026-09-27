/**
 * xPortal / WalletConnect V2 — mainnet login.
 * CJS interop robuste (Vite + GH Pages).
 *
 * Important mobile: ne jamais naviguer le navigateur vers xportal://
 * (Chrome → ERR_UNKNOWN_URL_SCHEME). Utiliser uniquement le universal link
 * https://maiar.page.link / xportal.com ; Web Wallet en fallback.
 */
import { XPORTAL_DEEP_LINKS, sdkDappConfig, WALLET_CONNECT_V2_RELAY_URL } from '../config/sdkDapp'
import * as WcNs from '@multiversx/sdk-wallet-connect-provider'

const MAINNET = '1'

export type XPortalLoginProgress = {
  phase: 'init' | 'uri' | 'waiting' | 'done' | 'error'
  uri?: string
  message?: string
}

type XcProvider = {
  init: () => Promise<boolean>
  connect: () => Promise<{ uri?: string; approval: () => Promise<unknown> }>
  getAddress?: () => Promise<string>
  address?: string
}

type WcCtor = new (
  callbacks: unknown,
  chainId: string,
  relayUrl: string,
  projectId: string,
) => XcProvider

function resolveWalletConnectCtor(): WcCtor | null {
  const roots: unknown[] = [WcNs, (WcNs as { default?: unknown }).default]
  for (const root of roots) {
    if (!root || typeof root !== 'object') continue
    const r = root as Record<string, unknown>
    const direct = r.WalletConnectV2Provider
    if (typeof direct === 'function') return direct as WcCtor
    const nested = r.default
    if (nested && typeof nested === 'object') {
      const n = (nested as Record<string, unknown>).WalletConnectV2Provider
      if (typeof n === 'function') return n as WcCtor
    }
    if (typeof nested === 'function' && /WalletConnect/i.test(String(nested.name))) {
      return nested as WcCtor
    }
    for (const v of Object.values(r)) {
      if (typeof v === 'function' && /WalletConnectV2/i.test(String((v as { name?: string }).name || v))) {
        return v as WcCtor
      }
    }
  }
  return null
}

/** Universal link only — never set location to xportal:// in Chrome */
function openXPortalWithUri(uri: string) {
  try {
    const deep =
      (typeof XPORTAL_DEEP_LINKS.walletConnectUri === 'function'
        ? XPORTAL_DEEP_LINKS.walletConnectUri(uri)
        : null) ||
      `https://maiar.page.link/?apn=com.elrond.maiar.wallet&isi=1519405832&ibi=com.elrond.maiar.wallet&link=${encodeURIComponent(
        `https://xportal.com/?wallet-connect=${encodeURIComponent(uri)}`,
      )}`

    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent || '')
    if (isMobile) {
      // iframe avoids killing the dApp tab with ERR_UNKNOWN_URL_SCHEME
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = deep
      document.body.appendChild(iframe)
      setTimeout(() => {
        try {
          document.body.removeChild(iframe)
        } catch {
          /* ignore */
        }
      }, 3000)
      // Also try top-level universal link (opens app store / app)
      window.open(deep, '_blank', 'noopener,noreferrer')
    } else {
      window.open(deep, '_blank', 'noopener,noreferrer')
    }
  } catch {
    /* ignore */
  }
}

export async function loginWithXPortalMainnet(
  onProgress?: (p: XPortalLoginProgress) => void,
): Promise<{ ok: true; address: string } | { ok: false; error: string }> {
  const projectId = sdkDappConfig.walletConnectV2ProjectId
  if (!projectId || projectId.length < 32) {
    return {
      ok: false,
      error:
        'WalletConnect projectId manquant. Utilise Web Wallet (recommandé sur GitHub Pages).',
    }
  }

  const WalletConnectV2Provider = resolveWalletConnectCtor()
  if (!WalletConnectV2Provider) {
    return {
      ok: false,
      error:
        'Module WalletConnect indisponible dans ce build. Utilise Web Wallet (recommandé).',
    }
  }

  onProgress?.({ phase: 'init', message: 'Initialisation WalletConnect mainnet…' })

  try {
    const callbacks = {
      onClientLogin: async () => undefined,
      onClientLogout: async () => undefined,
      onClientEvent: async () => undefined,
    }

    const provider = new WalletConnectV2Provider(
      callbacks,
      MAINNET,
      WALLET_CONNECT_V2_RELAY_URL,
      projectId,
    )

    await provider.init()
    const { uri, approval } = await provider.connect()

    if (uri) {
      onProgress?.({
        phase: 'uri',
        uri,
        message:
          'Approuve dans xPortal (app). Si Chrome affiche une erreur : utilise Web Wallet.',
      })
      openXPortalWithUri(uri)
    }

    onProgress?.({
      phase: 'waiting',
      uri,
      message: 'En attente d’approbation dans xPortal…',
    })
    await approval()

    let address = ''
    if (typeof provider.getAddress === 'function') {
      address = (await provider.getAddress()).trim()
    } else if (provider.address) {
      address = String(provider.address).trim()
    }

    if (!/^erd1[a-z0-9]{58}$/i.test(address)) {
      return { ok: false, error: 'Adresse xPortal invalide après login.' }
    }

    onProgress?.({ phase: 'done', message: address })
    return { ok: true, address }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    onProgress?.({ phase: 'error', message: msg })
    if (/reject/i.test(msg)) {
      return { ok: false, error: 'Connexion refusée dans xPortal.' }
    }
    return {
      ok: false,
      error: `xPortal WC indisponible (${msg.slice(0, 80)}). Utilise Web Wallet.`,
    }
  }
}
