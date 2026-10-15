/**
 * Accueil — Dôme / galerie 3D à portails + ticker $TRO / EGLD.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'
import { useI18n } from '../i18n/I18nContext'
import HomeMenuHall from '../components/home/HomeMenuHall'

const API = 'https://api.multiversx.com'

export default function Dashboard() {
  const { t } = useI18n()
  const { connected } = useWallet()
  const [egld, setEgld] = useState<number | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const r = await fetch(`${API}/economics`, { cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        const p = Number(j.price || j.egldPrice || 0)
        if (!c && p > 0) setEgld(p)
      } catch {
        /* offline */
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const troApprox = egld != null ? egld * 0.002 : null

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Infrastructure RWA · MultiversX
          </p>
          <h1 className="text-2xl font-semibold text-white tracking-tight">xArtists</h1>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            Entre dans les pièces — Musée · Command · Packs · Market
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-[11px] text-cyan-100">
            EGLD {egld != null ? `$${egld.toFixed(2)}` : '…'}
          </div>
          <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 font-mono text-[11px] text-violet-100">
            $TRO {troApprox != null ? `$${troApprox.toFixed(3)}` : '…'}
            {egld != null ? (
              <span className="text-zinc-500"> · {(troApprox! / egld).toFixed(3)} EGLD</span>
            ) : null}
          </div>
          {!connected && (
            <button type="button" onClick={requestOpenConnect} className="btn-primary text-xs min-h-[40px] px-3">
              {t('nav.wallet')}
            </button>
          )}
        </div>
      </header>

      <HomeMenuHall />

      <p className="text-center text-[11px] text-zinc-600">
        Clique une porte 3D pour entrer ·{' '}
        <Link to="/museum" className="text-zinc-400 hover:text-zinc-200">
          Musée
        </Link>
        {' · '}
        <Link to="/command-center" className="text-zinc-400 hover:text-zinc-200">
          Command
        </Link>
        {' · '}
        <Link to="/agents" className="text-zinc-400 hover:text-zinc-200">
          Packs
        </Link>
      </p>
    </div>
  )
}
