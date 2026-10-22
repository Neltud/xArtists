import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Accueil v0.110 — dôme 360° + ticker $TRO/EGLD + portails 3D COMMAND HUB.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'
import { useI18n } from '../i18n/I18nContext'
import HomeDomeBackground from '../components/home/HomeDomeBackground'
import HomeHudCards from '../components/home/HomeHudCards'
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
    <>
      <HomeDomeBackground />

      <div className="relative z-10 space-y-4 pb-28 max-w-5xl mx-auto px-1">
        <header className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-black/50 px-2.5 py-1 text-[10px] font-medium text-emerald-200 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
              {xaRender(t('home.dome.badge'))}
            </span>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-[11px] text-cyan-100 min-h-[40px] inline-flex items-center">
              {xaRender("EGLD ")}{xaRender(egld != null ? `$${egld.toFixed(2)}` : '…')}
            </span>
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 font-mono text-[11px] text-violet-100 min-h-[40px] inline-flex items-center">
              {xaRender("$TRO ")}{xaRender(troApprox != null ? `$${troApprox.toFixed(3)}` : '…')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {xaRender(!connected && (
              <button
                type="button"
                onClick={requestOpenConnect}
                className="btn-primary text-xs min-h-[44px] px-3"
              >
                {xaRender(t('nav.wallet'))}
              </button>
            ))}
            <Link
              to="/command-center"
              className="btn-secondary text-xs min-h-[44px] px-3 inline-flex items-center"
            >
              {xaRender(t('nav.command'))}
            </Link>
          </div>
        </header>

        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          {xaRender("COMMAND HUB · ")}{xaRender(t('home.hall.hint') || 'Entre dans les pièces')}
        </p>

        <HomeMenuHall />

        <HomeHudCards />
      </div>
    </>
  )
}
