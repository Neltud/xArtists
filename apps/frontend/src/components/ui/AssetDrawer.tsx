/**
 * Asset hub slide-over — tokens + NFT grid (memoized rows).
 */
import { memo, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAssets } from '../../hooks/useAssets'
import type { UserNft, UserToken } from '../../hooks/useUserAccount'

const TokenRow = memo(function TokenRow({ t }: { t: UserToken }) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-1.5">
      <div className="min-w-0">
        <p className="text-xs text-white font-medium truncate">
          {t.ticker}
          <span className="text-zinc-500 font-normal ml-1">{t.name}</span>
        </p>
        <p className="text-[9px] text-zinc-600 mono truncate">{t.identifier}</p>
      </div>
      <p className="text-xs mono text-zinc-200 shrink-0">
        {t.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
      </p>
    </li>
  )
})

const NftCard = memo(function NftCard({ n }: { n: UserNft }) {
  const img = n.url || n.media?.[0]?.url
  return (
    <li>
      <Link
        to="/museum"
        className="block rounded-xl border border-white/10 bg-black/40 overflow-hidden hover:border-fuchsia-400/40"
        title="Voir dans le Musée 3D"
      >
        <div className="aspect-square bg-zinc-900 flex items-center justify-center">
          {img && /^https?:/i.test(img) ? (
            <img src={img} alt={n.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="opacity-40 text-xl">🖼</span>
          )}
        </div>
        <p className="px-1.5 py-1 text-[10px] text-white truncate">{n.name}</p>
      </Link>
    </li>
  )
})

export default function AssetDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const assets = useAssets()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'tokens' | 'nfts'>('tokens')

  const tokens = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return assets.tokens
    return assets.tokens.filter(
      t =>
        t.ticker.toLowerCase().includes(qq) ||
        t.name.toLowerCase().includes(qq) ||
        t.identifier.toLowerCase().includes(qq)
    )
  }, [assets.tokens, q])

  const nfts = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return assets.nfts
    return assets.nfts.filter(
      n =>
        (n.name || '').toLowerCase().includes(qq) ||
        (n.collection || '').toLowerCase().includes(qq)
    )
  }, [assets.nfts, q])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-sm h-full border-l border-white/10 bg-[#0a0a10]/95 backdrop-blur-xl shadow-2xl flex flex-col animate-fade-in">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-semibold">
              Asset Hub
            </p>
            <p className="text-sm text-white font-medium">
              {assets.connected ? `${assets.egld.toFixed(4)} EGLD` : 'Non connecté'}
            </p>
          </div>
          <div className="flex gap-2">
            {assets.connected && (
              <button
                type="button"
                className="btn-secondary text-[10px] py-1"
                onClick={() => assets.refresh()}
              >
                ↻
              </button>
            )}
            <button type="button" className="btn-secondary text-[10px] py-1" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="px-3 py-2 flex gap-2 border-b border-white/5">
          <button
            type="button"
            className={`flex-1 rounded-lg text-xs py-1.5 border ${
              tab === 'tokens'
                ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                : 'border-white/10 text-zinc-500'
            }`}
            onClick={() => setTab('tokens')}
          >
            Tokens ({assets.tokens.length})
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg text-xs py-1.5 border ${
              tab === 'nfts'
                ? 'border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100'
                : 'border-white/10 text-zinc-500'
            }`}
            onClick={() => setTab('nfts')}
          >
            NFTs ({assets.nfts.length})
          </button>
        </div>

        <div className="px-3 py-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={tab === 'tokens' ? 'Filtrer token…' : 'Filtrer NFT…'}
            className="input-field w-full text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6">
          {!assets.connected && (
            <p className="text-sm text-zinc-500 py-6 text-center">
              Connecte ton wallet pour voir tokens & NFTs.
            </p>
          )}
          {assets.connected && assets.loading && (
            <p className="text-sm text-zinc-500 py-4">Chargement…</p>
          )}
          {assets.connected && tab === 'tokens' && (
            <ul className="space-y-1.5">
              {tokens.map(t => (
                <TokenRow key={t.identifier} t={t} />
              ))}
              {!tokens.length && !assets.loading && (
                <p className="text-xs text-zinc-600 py-4 text-center">Aucun token ESDT</p>
              )}
            </ul>
          )}
          {assets.connected && tab === 'nfts' && (
            <>
              <ul className="grid grid-cols-3 gap-2">
                {nfts.map(n => (
                  <NftCard key={n.identifier} n={n} />
                ))}
              </ul>
              {!nfts.length && !assets.loading && (
                <p className="text-xs text-zinc-600 py-4 text-center">Aucun NFT</p>
              )}
              {!!nfts.length && (
                <p className="text-[10px] text-zinc-600 mt-3 text-center">Clic → Musée 3D (Mydee)</p>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
