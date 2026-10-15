/**
 * Marketplace panel — Frameit indexing + RWA Physical Art tabs.
 * Floor price (MVX API) + Trade on Frameit / Xoxno deep links.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  fetchAllPackMarkets,
  formatFloor,
  type CollectionMarketSnapshot,
} from '../../services/frameitApi'

type Tab = 'frameit' | 'rwa'

export default function FrameitMarketPanel() {
  const [tab, setTab] = useState<Tab>('frameit')
  const [rows, setRows] = useState<CollectionMarketSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchAllPackMarkets(force)
      setRows(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'market fetch failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-white">Secondary market</h2>
        <div className="ml-auto flex gap-1 rounded-lg bg-white/5 p-1 text-sm">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 transition ${
              tab === 'frameit' ? 'bg-cyan-500/20 text-cyan-200' : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setTab('frameit')}
          >
            Frameit Indexing
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 transition ${
              tab === 'rwa' ? 'bg-amber-500/20 text-amber-100' : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setTab('rwa')}
          >
            RWA Physical Art
          </button>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
        >
          Refresh
        </button>
      </div>

      {tab === 'frameit' && (
        <div className="space-y-3">
          {loading && <p className="text-sm text-white/50">Indexing collections…</p>}
          {err && <p className="text-sm text-rose-300">{err}</p>}
          {!loading &&
            rows.map(r => (
              <div
                key={r.collection}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-3"
              >
                <div className="min-w-[8rem] flex-1">
                  <div className="font-medium text-white">{r.name}</div>
                  <div className="font-mono text-xs text-white/45">{r.collection}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-white/50">Floor</div>
                  <div className="font-semibold text-cyan-200">{formatFloor(r.floorEgld)}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-white/50">Supply</div>
                  <div className="text-white/90">{r.nftsCount}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={r.frameitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/30"
                  >
                    Trade on Frameit
                  </a>
                  <a
                    href={r.xoxnoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-100 hover:bg-violet-500/30"
                  >
                    Trade on Xoxno
                  </a>
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === 'rwa' && (
        <div className="space-y-2 text-sm text-white/75">
          <p>
            Œuvres physiques liées (dimensions, médium, chip NFC, certificat on-chain) — schéma{' '}
            <code className="text-amber-200/90">rwaMetadata.ts</code>.
          </p>
          <ul className="list-inside list-disc space-y-1 text-white/60">
            <li>Provenance record → IPFS metadata + NFT certificate</li>
            <li>NFC chip ID optionnel pour vérification phygitale</li>
            <li>Escrow / livraison : bridge P2 (rwa_escrow)</li>
          </ul>
          <p className="text-xs text-white/40">
            Les packs IA (Pulse / Yield / Sentinel) restent des entitlements d’accès — distincts des
            RWA physiques Studio.
          </p>
        </div>
      )}
    </section>
  )
}
