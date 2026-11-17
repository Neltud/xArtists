import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * xOrus — public decision desk (LIA UI retired).
 * Paper intelligence only. No live trading, mint, or autonomous execution.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import IntelligencePath from '../components/intelligence/IntelligencePath'
import XorusDecisionDesk from '../components/intelligence/XorusDecisionDesk'
import { useI18n } from '../i18n/I18nContext'
import DailySignalWidget from '../components/DailySignalWidget'
import LiveAssetTape from '../components/LiveAssetTape'
import RceStrip from '../components/RceStrip'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
import { XORUS_BADGE, XORUS_LIVE_TRADING } from '../config/xorusConfig'
import XorusAssistedSwapPanel from '../components/intelligence/XorusAssistedSwapPanel'

export default function XorusPage() {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const [showArchive, setShowArchive] = useState(false)

  useEffect(() => {
    // Hard front guard: LIA live path must never appear as active on this page.
    if (XORUS_LIVE_TRADING) {
      console.warn('[xOrus] LIVE_TRADING flag must stay false — paper desk only')
    }
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {xaRender('Intelligence · xOrus')}
        </p>
        <h1 className="text-2xl font-semibold text-white md:text-3xl">
          {fr ? 'Bureau de décision xOrus' : 'xOrus decision desk'}
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          {fr
            ? 'Analyse paper, 120 signaux définis, dual reports, veto Sentinel. LIA / Vellum retiré — aucune exécution autonome.'
            : 'Paper analysis, 120 defined signals, dual reports, Sentinel veto. LIA / Vellum retired — no autonomous execution.'}
        </p>
        <p className="text-xs text-zinc-500">{XORUS_BADGE}</p>
      </header>

      <IntelligencePath />

      <section aria-label="xOrus decision">
        <XorusDecisionDesk />
      </section>

      <section aria-label="Assisted OneDex swap">
        <XorusAssistedSwapPanel />
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Signals and tape">
        <DailySignalWidget />
        <LiveAssetTape />
      </section>

      <RceStrip />

      <section className="rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-400">
            {fr
              ? 'Consoles LIA archivées (lecture seule, non opérationnelles).'
              : 'Archived LIA consoles (read-only, non-operational).'}
          </p>
          <button
            type="button"
            className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-300"
            onClick={() => setShowArchive(v => !v)}
          >
            {showArchive ? (fr ? 'Masquer' : 'Hide') : (fr ? 'Afficher archive' : 'Show archive')}
          </button>
        </div>
        {showArchive && (
          <div className="mt-4 space-y-3 text-xs text-zinc-500">
            <p>
              {fr
                ? 'Les panels LIA Hub, Agent Control, Command Terminal et Intent Feed ne sont plus montés sur cette page. Utilisez le Command Center restreint si besoin d’historique.'
                : 'LIA Hub, Agent Control, Command Terminal and Intent Feed panels are no longer mounted here. Use the restricted Command Center for history if needed.'}
            </p>
            <Pack3DCockpit />
          </div>
        )}
      </section>

      <nav className="flex flex-wrap gap-3 text-xs text-zinc-400" aria-label="Additional tools">
        <Link to="/command-center" className="underline underline-offset-4 hover:text-white">
          Command Center (access restricted)
        </Link>
        <Link to="/studio" className="underline underline-offset-4 hover:text-white">
          Creative Studio
        </Link>
        <Link to="/agents" className="underline underline-offset-4 hover:text-white">
          Agent packs
        </Link>
      </nav>
    </div>
  )
}
