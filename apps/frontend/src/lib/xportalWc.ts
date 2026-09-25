/**
 * xPortal / WalletConnect V2 — mainnet login.
 */
import { XPORTAL_DEEP_LINKS, sdkDappConfig, WALLET_CONNECT_V2_RELAY_URL } from '../config/sdkDapp'

const MAINNET = '1'

export type XPortalLoginProgress = {
  phase: 'init' | 'uri' | 'waiting' | 'done' | 'error'
  uri?: string
  message?: string
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
    window.open(deep, '_blank', 'noopener,noreferrer')
  } catch {
    /* ignore */
  }
}

type XcProvider = {
  init: () => Promise<boolean>
  connect: () => Promise<{ uri?: string; approval: () => Promise<unknown> }>
  getAddress?: () => Promise<string>
  address?: string
}

export async function loginWithXPortalMainnet(
  onProgress?: (p: XPortalLoginProgress) => void,
): Promise<{ ok: true; address: string } | { ok: false; error: string }> {
  const projectId = sdkDappConfig.walletConnectV2ProjectId
  if (!projectId || projectId.length < 32) {
    return { ok: false, error: 'WalletConnect projectId manquant (VITE_WALLETCONNECT_PROJECT_ID).' }
  }

  onProgress?.({ phase: 'init', message: 'Initialisation WalletConnect…' })

  try {
    const mod = await import('@multiversx/sdk-wallet-connect-provider')
    const WalletConnectV2Provider = (
      mod as {
        WalletConnectV2Provider?: new (
          callbacks: unknown,
          chainId: string,
          relayUrl: string,
          projectId: string,
        ) => XcProvider
      }
    ).WalletConnectV2Provider

    if (!WalletConnectV2Provider) {
      return {
        ok: false,
        error: 'Module WC indisponible au build. Utilise Web Wallet (recommandé).',
      }
    }

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
      onProgress?.({ phase: 'uri', uri, message: 'Scanne ou ouvre xPortal pour approuver' })
      openXPortalWithUri(uri)
    }

    onProgress?.({ phase: 'waiting', uri, message: 'En attente d’approbation xPortal…' })
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
      error: `xPortal WC: ${msg}. Utilise Web Wallet pour mainnet.`,
    }
  }
}
