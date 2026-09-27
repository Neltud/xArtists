/**
 * Session wallet connecté (xPortal / Web) — lecture on-chain live + claim points.
 * Pas de signature auto : actions signées restent explicites (tip, stake…).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useDailyPoints } from '../hooks/useDailyPoints'

type Live = {
  egld: number
  tokenCount: number
  nftCount: number
  top: { ticker: string; bal: number }[]
  hasTroLp: boolean
}

const API = 'https://api.multiversx.com'

export default function ConnectedSessionPanel() {
  const { connected, address, method } = useWallet()
  const { totalPoints, streak, canClaimToday, claim } = useDailyPoints()
  const [live, setLive] = useState<Live | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!connected || !address) {
      setLive(null)
      return
    }
    let c = false
    setLoading(true)
    setErr(null)
    ;(async () => {
      try {
        const [acc, tokens, nftCount] = await Promise.all([
          fetch(`${API}/accounts/${address}`).then(r => r.json()),
          fetch(`${API}/accounts/${address}/tokens?size=50`).then(r => r.json()),
          fetch(`${API}/accounts/${address}/nfts/count`).then(r => r.json()),
        ])
        if (c) return
        const list = Array.isArray(tokens) ? tokens : []
        const top = list
          .slice(0, 6)
          .map((t: { ticker?: string; identifier?: string; balance?: string; decimals?: number }) => {
            const dec = Number(t.decimals ?? 18) || 18
            const bal = Number(t.balance || 0) / 10 ** dec
            return { ticker: t.ticker || t.identifier || '?', bal }
          })
        const hasTroLp = list.some((t: { identifier?: string }) =>
          /TRO|LPROAR/i.test(t.identifier || ''),
        )
        setLive({
          egld: Number(acc.balance || 0) / 1e18,
          tokenCount: list.length,
          nftCount: Number(nftCount) || 0,
          top,
          hasTroLp,
        })
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'API error')
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [connected, address])

  if (!connected || !address) {
    return (
      <div className="card border border-white/10 space-y-2">
        <p className="text-[12px] text-zinc-400">Session wallet</p>
        <p className="text-[13px] text-zinc-500">
          Connecte xPortal ou Web Wallet pour voir solde live, NFTs et claim quotidien.
        </p>
      </div>
    )
  }

  const short = address.slice(0, 8) + '…' + address.slice(-6)

  return (
    <div className="card border border-emerald-500/20 bg-emerald-500/[0.04] space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-emerald-300/80">
            Session · {method || 'wallet'}
          </p>
          <p className="mono text-[12px] text-white break-all">{short}</p>
        </div>
        <a
          href={`https://explorer.multiversx.com/accounts/${address}`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-cyan-400 hover:underline shrink-0"
        >
          Explorer ↗
        </a>
      </div>

      {loading && <p className="text-[12px] text-zinc-500">Lecture mainnet…</p>}
      {err && <p className="text-[12px] text-rose-400">{err}</p>}

      {live && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-black/30 border border-white/5 py-2">
            <p className="text-lg font-semibold text-white tabular-nums">{live.egld.toFixed(3)}</p>
            <p className="text-[10px] text-zinc-500">EGLD</p>
          </div>
          <div className="rounded-xl bg-black/30 border border-white/5 py-2">
            <p className="text-lg font-semibold text-white tabular-nums">{live.tokenCount}</p>
            <p className="text-[10px] text-zinc-500">tokens</p>
          </div>
          <div className="rounded-xl bg-black/30 border border-white/5 py-2">
            <p className="text-lg font-semibold text-white tabular-nums">{live.nftCount}</p>
            <p className="text-[10px] text-zinc-500">NFTs</p>
          </div>
        </div>
      )}

      {live?.top && live.top.length > 0 && (
        <div className="text-[11px] text-zinc-500 space-y-0.5">
          {live.top.map(t => (
            <div key={t.ticker} className="flex justify-between gap-2">
              <span className="text-zinc-400 truncate">{t.ticker}</span>
              <span className="tabular-nums text-zinc-300">{t.bal > 1 ? t.bal.toFixed(2) : t.bal.toPrecision(3)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={!canClaimToday}
          onClick={claim}
          className="btn-primary text-[12px] py-1.5 px-3 disabled:opacity-40"
        >
          {canClaimToday ? 'Claim +1 pt aujourd’hui' : 'Déjà claim aujourd’hui'}
        </button>
        <span className="text-[11px] text-zinc-500">
          {totalPoints} pts · série {streak}j
          {streak > 0 && streak % 7 === 0 ? ' · bonus 7j OK' : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <Link to="/museum?tab=mine" className="text-cyan-400 hover:underline">
          Mes NFTs en musée
        </Link>
        <span className="text-zinc-700">·</span>
        <Link to="/tip" className="text-cyan-400 hover:underline">
          Tip / services
        </Link>
        <span className="text-zinc-700">·</span>
        <Link to="/dao" className="text-cyan-400 hover:underline">
          DAO{live?.hasTroLp ? ' (LP TRO détecté)' : ''}
        </Link>
        <span className="text-zinc-700">·</span>
        <Link to="/wallet" className="text-cyan-400 hover:underline">
          Wallet détail
        </Link>
      </div>

      <p className="text-[10px] text-zinc-600">
        Lecture API publique MultiversX. Aucune tx signée automatiquement — tu confirmes chaque action dans
        xPortal.
      </p>
    </div>
  )
}
