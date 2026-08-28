/**
 * Sprint 1 — Moteur de connexion MultiversX (réel + paper).
 * Les TX live passent par le wallet utilisateur (sdk-dapp / provider) — jamais de clé privée front.
 */
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers'
import type { Intent, ExecutionResult } from '../types/intent'
import { validateIntent } from '../core/doctrine'

const MAINNET_API = 'https://api.multiversx.com'
const GATEWAY = 'https://gateway.multiversx.com'

export type NetworkId = 'mainnet' | 'devnet'

function liveTradingEnabled(): boolean {
  try {
    return import.meta.env.VITE_LIA_LIVE_TRADING === '1'
  } catch {
    return false
  }
}

export class MultiversXService {
  readonly network: NetworkId
  private provider: ApiNetworkProvider

  constructor(network: NetworkId = 'mainnet') {
    this.network = network
    const url = network === 'mainnet' ? MAINNET_API : 'https://devnet-api.multiversx.com'
    this.provider = new ApiNetworkProvider(url, { clientName: 'xartists-sprint1' })
  }

  /** Lecture solde EGLD (atomic string). */
  async getEgldBalance(address: string): Promise<string> {
    const acc = await this.provider.getAccount(address)
    return acc.balance.toString(10)
  }

  /** ESDT balance via API REST (simple). */
  async getAssetBalance(address: string, assetId: string): Promise<string> {
    if (!assetId || assetId.toUpperCase() === 'EGLD') {
      return this.getEgldBalance(address)
    }
    const base = this.network === 'mainnet' ? MAINNET_API : 'https://devnet-api.multiversx.com'
    const r = await fetch(`${base}/accounts/${address}/tokens/${encodeURIComponent(assetId)}`)
    if (!r.ok) return '0'
    const j = (await r.json()) as { balance?: string }
    return j.balance ?? '0'
  }

  async getTransactionStatus(hash: string): Promise<'pending' | 'success' | 'fail' | 'unknown'> {
    try {
      const base = this.network === 'mainnet' ? MAINNET_API : 'https://devnet-api.multiversx.com'
      const r = await fetch(`${base}/transactions/${hash}`)
      if (!r.ok) return 'unknown'
      const j = (await r.json()) as { status?: string }
      const s = (j.status || '').toLowerCase()
      if (s === 'success' || s === 'executed') return 'success'
      if (s === 'pending' || s === 'received') return 'pending'
      if (s === 'fail' || s === 'invalid') return 'fail'
      return 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * Exécution : paper par défaut.
   * Live = uniquement si doctrine OK + VITE_LIA_LIVE_TRADING=1 + userConfirmedLive
   * et signature via callback wallet (injecté par le hook).
   */
  async executeIntent(
    intent: Intent,
    opts?: {
      signAndSend?: (intent: Intent) => Promise<{ txHash: string }>
    }
  ): Promise<ExecutionResult> {
    const v = validateIntent(intent)
    if (!v.ok) {
      return {
        lifecycle: 'rejected',
        message: v.issues.map(i => i.message).join(' · '),
        paper: true,
        intent,
      }
    }

    const wantLive =
      intent.metadata?.paper === false &&
      intent.metadata?.userConfirmedLive === true &&
      liveTradingEnabled()

    if (!wantLive || v.forcePaper) {
      return {
        lifecycle: 'success',
        message: `Paper OK — ${intent.type} · amount ${intent.amount} (non broadcast). Doctrine pass.`,
        paper: true,
        intent: { ...intent, metadata: { ...intent.metadata, paper: true } },
      }
    }

    if (!opts?.signAndSend) {
      return {
        lifecycle: 'error',
        message: 'Live demandé mais aucun signAndSend wallet fourni.',
        paper: false,
        intent,
      }
    }

    try {
      const { txHash } = await opts.signAndSend(intent)
      return {
        lifecycle: 'broadcast',
        txHash,
        message: `TX envoyée — ${txHash.slice(0, 12)}…`,
        paper: false,
        intent,
      }
    } catch (e) {
      return {
        lifecycle: 'error',
        message: e instanceof Error ? e.message : 'Échec signature/envoi',
        paper: false,
        intent,
      }
    }
  }

  explorerTx(hash: string): string {
    const net = this.network === 'mainnet' ? '' : 'devnet-'
    return `https://${net}explorer.multiversx.com/transactions/${hash}`
  }

  gatewayUrl(): string {
    return this.network === 'mainnet' ? GATEWAY : 'https://devnet-gateway.multiversx.com'
  }
}

export const multiversXService = new MultiversXService('mainnet')
