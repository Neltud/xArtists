/**
 * xOrus — public decision desk (LIA UI retired).
 * Mainnet observations and source-backed analysis, read only.
 * The legacy simulation remains accessible explicitly, never the default.
 */
import { useEffect, useState } from 'react'
import {useSearchParams} from 'react-router-dom'
import {useNetworkCopy} from '../experience/networkCopy'
import { Link } from 'react-router-dom'
import XorusDecisionDesk from '../components/intelligence/XorusDecisionDesk'
import XorusNetworkStatus from '../components/intelligence/XorusNetworkStatus'
import { useI18n } from '../i18n/I18nContext'
import DailySignalWidget from '../components/DailySignalWidget'
import LiveAssetTape from '../components/LiveAssetTape'
import RceStrip from '../components/RceStrip'
import { XORUS_BADGE, XORUS_LIVE_TRADING } from '../config/xorusConfig'
import XorusAssistedSwapPanel from '../components/intelligence/XorusAssistedSwapPanel'
import PaperTradingPanel from '../components/intelligence/PaperTradingPanel'

export default function XorusPage() {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const n=useNetworkCopy(),[params,setParams]=useSearchParams()
  const view=params.get('view')==='simulation'?'simulation':'analysis'
  const choose=(next:string)=>setParams(p=>{const q=new URLSearchParams(p);if(next==='analysis')q.delete('view');else q.set('view',next);return q})
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (XORUS_LIVE_TRADING) {
      console.warn('[xOrus] LIVE_TRADING flag must stay false — paper desk only')
    }
  }, [])

  return (
    <div className="xa-task-page xa-xorus-page">
      <header className="xa-task-header"><div><p className="xa-task-kicker">Agents & IA</p><h1>{n('analysis')}</h1></div><Link to="/agents" className="xa-button secondary">{n('agents')} →</Link></header>
      <p className="xa-task-status">{view==='simulation'?n('paper'):n('readOnly')}</p>
      {view==='simulation'&&<button type="button" className="xa-button secondary" onClick={()=>choose('analysis')}>{n('analysis')} →</button>}
      {view==='analysis'&&<XorusNetworkStatus/>}
      {view==='simulation'?<PaperTradingPanel/>:<section aria-label="xOrus decision"><XorusDecisionDesk /></section>}
      <details className="xa-task-details"><summary>{n('research')}</summary><p>{fr?'xOrus observe, compare et s’abstient quand les preuves manquent. Aucun ordre n’est envoyé depuis cette page.':'xOrus observes, compares and abstains when evidence is thin. This page sends no order.'}</p><p>{XORUS_BADGE}</p>{view==='analysis'&&<p><button type="button" className="xa-button secondary" onClick={()=>choose('simulation')}>{n('simulation')}</button></p>}<button type="button" className="xa-button secondary" aria-expanded={showAdvanced} onClick={()=>setShowAdvanced(v=>!v)}>{showAdvanced?(fr?'Masquer les outils avancés':'Hide advanced tools'):(fr?'Afficher les outils avancés':'Show advanced tools')}</button></details>

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

        </>
      )}
    </div>
  )
}
