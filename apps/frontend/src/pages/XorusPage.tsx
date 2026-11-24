import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * xOrus — public decision desk (LIA UI retired).
 * Paper intelligence only. No live trading, mint, or autonomous execution.
 * The novice heading stays visible. Swap prep and LIA archives stay behind
 * an explicit advanced toggle. Nothing here signs or spends.
 */
import { useEffect, useState } from 'react'
import {useSearchParams} from 'react-router-dom'
import {useNetworkCopy} from '../experience/networkCopy'
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
  const n=useNetworkCopy(),[params,setParams]=useSearchParams()
  const view=params.get('view')==='simulation'?'simulation':'analysis'
  const choose=(next:string)=>setParams(p=>{const q=new URLSearchParams(p);if(next==='analysis')q.delete('view');else q.set('view',next);return q})
  const [showArchive, setShowArchive] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (XORUS_LIVE_TRADING) {
      console.warn('[xOrus] LIVE_TRADING flag must stay false — paper desk only')
    }
  }, [])

  return (
    <div className="xa-task-page xa-xorus-page">
      <header className="xa-task-header"><div><p className="xa-task-kicker">Agents & IA</p><h1>{n('analysis')}</h1><p>{n('analysisIntro')}</p></div><Link to="/agents" className="xa-button secondary">{n('agents')} →</Link></header>
      <nav className="xa-task-tabs" aria-label={n('analysis')}><button type="button" aria-current={view==='analysis'?'page':undefined} onClick={()=>choose('analysis')}>{n('analysis')}</button><button type="button" aria-current={view==='simulation'?'page':undefined} onClick={()=>choose('simulation')}>{n('simulation')}</button></nav>
      <p className="xa-task-status">{n('paper')}</p>
      {view==='simulation'?<PaperTradingPanel/>:<section aria-label="xOrus decision"><XorusDecisionDesk /></section>}
      <details className="xa-task-details"><summary>{n('research')}</summary><p>{fr?'xOrus observe, compare et s’abstient quand les preuves manquent. Aucun ordre n’est envoyé depuis cette page.':'xOrus observes, compares and abstains when evidence is thin. This page sends no order.'}</p><p>{XORUS_BADGE}</p><button type="button" className="xa-button secondary" aria-expanded={showAdvanced} onClick={()=>setShowAdvanced(v=>!v)}>{showAdvanced?(fr?'Masquer les outils avancés':'Hide advanced tools'):(fr?'Afficher les outils avancés':'Show advanced tools')}</button></details>

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
