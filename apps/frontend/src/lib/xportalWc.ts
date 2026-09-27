/**
 * xPortal / WalletConnect V2 — mainnet login.
 * Import statique du provider pour que Vite l’inclue dans le bundle Pages.
 * Fallback : Web Wallet.
 */
import { XPORTAL_DEEP_LINKS, sdkDappConfig, WALLET_CONNECT_V2_RELAY_URL } from '../config/sdkDapp'

// CJS package — interop Vite
import * as WcProviderMod from '@multiversx/sdk-wallet-connect-provider'

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
  const m = WcProviderMod as unknown as {
    WalletConnectV2Provider?: WcCtor
    default?: { WalletConnectV2Provider?: WcCtor } | WcCtor
  }
  if (m.WalletConnectV2Provider) return m.WalletConnectV2Provider
  if (m.default && typeof m.default === 'function') return m.default as WcCtor
  if (m.default && typeof m.default === 'object' && m.default.WalletConnectV2Provider) {
    return m.default.WalletConnectV2Provider
  }
  return null
}

function openXPortalWithUri(uri: string) {
  try {
    const encoded = encodeURIComponent(uri)
    const deep =
      (typeof XPORTAL_DEEP_LINKS.walletConnectUri === 'function'
        ? XPORTAL_DEEP_LINKS.walletConnectUri(uri)
        : null) ||
      `https://maiar.page.link/?apn=com.elrond.maiar.wallet&isi=1519405832&ibi=com.elrond.maiar.wallet&link=${encodeURIComponent(
        `https://xportal.com/?wallet-connect=${encoded}`,
      )}`
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent || '')
    if (isMobile) {
      window.location.href = deep
    } else {
      window.open(deep, '_blank', 'noopener,noreferrer')
    }
    try {
      const a = document.createElement('a')
      a.href = `xportal://wc?uri=${encoded}`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      /* ignore */
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
        'Module WalletConnect absent du bundle. Utilise Web Wallet — fiable sur neltud.github.io.',
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
          'Ouvre xPortal et approuve. Si rien ne s’ouvre : Web Wallet recommandé.',
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
