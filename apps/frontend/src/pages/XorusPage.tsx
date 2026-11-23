import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * xOrus — public decision desk (LIA UI retired).
 * Paper intelligence only. No live trading, mint, or autonomous execution.
 * The novice heading stays visible. Swap prep and LIA archives stay behind
 * an explicit advanced toggle. Nothing here signs or spends.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import XorusDecisionDesk from '../components/intelligence/XorusDecisionDesk'
import { useI18n } from '../i18n/I18nContext'
import DailySignalWidget from '../components/DailySignalWidget'
import LiveAssetTape from '../components/LiveAssetTape'
import RceStrip from '../components/RceStrip'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
import { XORUS_BADGE, XORUS_LIVE_TRADING } from '../config/xorusConfig'
import XorusAssistedSwapPanel from '../components/intelligence/XorusAssistedSwapPanel'
import PaperTradingPanel from '../components/intelligence/PaperTradingPanel'

void xaLocalize

export default function XorusPage() {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const [showArchive, setShowArchive] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
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
        <h1 className="text-2xl font-semibold text-zinc-950 md:text-3xl dark:text-white">
          {fr ? 'xOrus, l’intelligence expliquée simplement' : 'xOrus, explained simply'}
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          {fr
            ? 'Lecture paper. xOrus observe, compare et s’abstient quand les preuves manquent. Aucun ordre n’est envoyé depuis cette page.'
            : 'Paper reading. xOrus observes, compares and abstains when evidence is thin. This page sends no order.'}
        </p>
        <p className="text-xs text-zinc-500">{XORUS_BADGE}</p>
        <button
          type="button"
          className="mt-2 min-h-11 rounded-full border border-zinc-300 px-4 text-sm text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
          aria-expanded={showAdvanced}
          onClick={() => setShowAdvanced((open) => !open)}
        >
          {showAdvanced
            ? (fr ? 'Masquer les outils avancés' : 'Hide advanced tools')
            : (fr ? 'Afficher les outils avancés' : 'Show advanced tools')}
        </button>
      </header>


      <PaperTradingPanel />

      <section aria-label="xOrus decision">
        <XorusDecisionDesk />
      </section>

      {showAdvanced && (
        <>
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
                className="min-h-11 text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-300"
                onClick={() => setShowArchive((open) => !open)}
              >
                {showArchive ? (fr ? 'Masquer' : 'Hide') : (fr ? 'Afficher archive' : 'Show archive')}
              </button>
            </div>
            {showArchive && (
              <div className="mt-4 space-y-3 text-xs text-zinc-500">
                <p>
                  {fr
                    ? 'Les panels LIA Hub, Agent Control, Command Terminal et Intent Feed ne sont plus montés sur cette page.'
                    : 'LIA Hub, Agent Control, Command Terminal and Intent Feed panels are no longer mounted here.'}
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
        </>
      )}
    </div>
  )
}
