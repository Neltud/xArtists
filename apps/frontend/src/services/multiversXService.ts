/**
 * v3.0 — Provider MultiversX (réseau réel).
 * Pas de setTimeout de simulation. Lectures API réelles + statut TX.
 * Signature : wallet utilisateur uniquement (callback signAndSend).
 */
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers'
import type { ExecutionResult, Intent, NetworkMode } from '../types/intent'
import { validateIntent } from '../core/doctrine'
import { canonicalIntentType } from '../types/intent'

const ENDPOINTS: Record<NetworkMode, { api: string; gateway: string; explorer: string }> = {
  mainnet: {
    api: 'https://api.multiversx.com',
    gateway: 'https://gateway.multiversx.com',
    explorer: 'https://explorer.multiversx.com',
  },
  devnet: {
    api: 'https://devnet-api.multiversx.com',
    gateway: 'https://devnet-gateway.multiversx.com',
    explorer: 'https://devnet-explorer.multiversx.com',
  },
  testnet: {
    api: 'https://testnet-api.multiversx.com',
    gateway: 'https://testnet-gateway.multiversx.com',
    explorer: 'https://testnet-explorer.multiversx.com',
  },
}

function liveTradingEnabled(): boolean {
  try {
    return import.meta.env.VITE_LIA_LIVE_TRADING === '1'
  } catch {
    return false
  }
}

export type SignAndSendFn = (intent: Intent) => Promise<{ txHash: string }>

export class MultiversXService {
  network: NetworkMode
  private provider: ApiNetworkProvider
  private connectedAddress: string | null = null

  constructor(network: NetworkMode = 'mainnet') {
    this.network = network
    this.provider = new ApiNetworkProvider(ENDPOINTS[network].api, {
      clientName: 'xartists-v3',
    })
  }

  setNetwork(network: NetworkMode) {
    this.network = network
    this.provider = new ApiNetworkProvider(ENDPOINTS[network].api, {
      clientName: 'xartists-v3',
    })
  }

  /** Enregistre l’adresse session (pas de clé privée). */
  connect(address: string): { ok: boolean; error?: string } {
    if (!/^erd1[a-z0-9]{58}$/i.test(address)) {
      return { ok: false, error: 'Adresse erd1 invalide' }
    }
    this.connectedAddress = address.trim()
    return { ok: true }
  }

  disconnect() {
    this.connectedAddress = null
  }

  getConnectedAddress(): string | null {
    return this.connectedAddress
  }

  async getRealBalance(address: string, assetId = 'EGLD'): Promise<string> {
    if (!assetId || assetId.toUpperCase() === 'EGLD') {
      const acc = await this.provider.getAccount(address)
      return acc.balance.toString(10)
    }
    const base = ENDPOINTS[this.network].api
    const r = await fetch(`${base}/accounts/${address}/tokens/${encodeURIComponent(assetId)}`)
    if (!r.ok) return '0'
    const j = (await r.json()) as { balance?: string }
    return j.balance ?? '0'
  }

  /** Alias audit mission */
  getAssetBalance(address: string, assetId: string): Promise<string> {
    return this.getRealBalance(address, assetId)
  }

  async monitorTransactionStatus(
    hash: string
  ): Promise<'pending' | 'success' | 'fail' | 'unknown'> {
    const base = ENDPOINTS[this.network].api
    const r = await fetch(`${base}/transactions/${hash}`)
    if (!r.ok) return 'unknown'
    const j = (await r.json()) as { status?: string }
    const s = (j.status || '').toLowerCase()
    if (s === 'success' || s === 'executed') return 'success'
    if (s === 'pending' || s === 'received') return 'pending'
    if (s === 'fail' || s === 'invalid' || s === 'invalidTx') return 'fail'
    return 'unknown'
  }

  getTransactionStatus(hash: string) {
    return this.monitorTransactionStatus(hash)
  }

  /**
   * Exécution intent : validation doctrine → paper ou signAndSend réel.
   * Aucun setTimeout de faux succès.
   */
  async executeIntent(
    intent: Intent,
    opts?: { signAndSend?: SignAndSendFn }
  ): Promise<ExecutionResult> {
    const v = validateIntent(intent)
    if (!v.ok) {
      return {
        lifecycle: 'rejected',
        message: v.issues.map(i => `[${i.level}] ${i.message}`).join(' · '),
        paper: true,
        intent,
        stageError: 'VALIDATION',
      }
    }

    const type = canonicalIntentType(intent.type)

    // Balance query = lecture réelle, pas de TX
    if (type === 'BALANCE_QUERY') {
      const addr = intent.targetAddress || this.connectedAddress
      if (!addr) {
        return {
          lifecycle: 'error',
          message: 'Adresse requise pour solde.',
          paper: true,
          intent,
          stageError: 'VALIDATION',
        }
      }
      try {
        const bal = await this.getRealBalance(addr, intent.assetFrom || 'EGLD')
        return {
          lifecycle: 'success',
          message: `Solde réel ${intent.assetFrom || 'EGLD'}: ${bal} (atomic)`,
          paper: true,
          intent,
          stageError: null,
        }
      } catch (e) {
        return {
          lifecycle: 'error',
          message: e instanceof Error ? e.message : 'Lecture solde échouée',
          paper: true,
          intent,
          stageError: 'CONFIRMATION',
        }
      }
    }

    const wantLive =
      intent.metadata?.paper === false &&
      intent.metadata?.userConfirmedLive === true &&
      liveTradingEnabled()

    if (!wantLive || v.forcePaper) {
      return {
        lifecycle: 'success',
        message: `Paper validé — ${type} amount=${intent.amount} (non broadcast). Doctrine OK.`,
        paper: true,
        intent: { ...intent, metadata: { ...intent.metadata, paper: true } },
        stageError: null,
      }
    }

    // SWAP live : nécessite route DEX + sign — sinon erreur claire
    if (type === 'SWAP' && !opts?.signAndSend) {
      return {
        lifecycle: 'error',
        message:
          'SWAP live : fournissez signAndSend (wallet). Route xExchange à brancher côté ops.',
        paper: false,
        intent,
        stageError: 'SIGNATURE',
      }
    }

    if (!opts?.signAndSend) {
      return {
        lifecycle: 'error',
        message: 'Live demandé mais signAndSend absent (connecte le wallet signant).',
        paper: false,
        intent,
        stageError: 'SIGNATURE',
      }
    }

    try {
      const { txHash } = await opts.signAndSend(intent)
      if (!txHash || txHash.length < 16) {
        return {
          lifecycle: 'error',
          message: 'Transmission : hash TX invalide.',
          paper: false,
          intent,
          stageError: 'TRANSMISSION',
        }
      }
      return {
        lifecycle: 'broadcast',
        txHash,
        message: `TX diffusée — ${txHash.slice(0, 16)}…`,
        paper: false,
        intent,
        stageError: null,
      }
    } catch (e) {
      return {
        lifecycle: 'error',
        message: e instanceof Error ? e.message : 'Échec signature/envoi',
        paper: false,
        intent,
        stageError: 'SIGNATURE',
      }
    }
  }

  explorerTx(hash: string): string {
    return `${ENDPOINTS[this.network].explorer}/transactions/${hash}`
  }
}

export const multiversXService = new MultiversXService(
  (import.meta.env.VITE_MX_NETWORK as NetworkMode) || 'mainnet'
)
