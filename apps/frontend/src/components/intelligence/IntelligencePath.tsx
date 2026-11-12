import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

/** A single human-readable itinerary for the three public intelligence pages.
 * Deliberately read-only. No connection, subscription or trade is required.
 */
const steps = [
  { path: '/intelligence/xorus', fr:'Comprendre', en:'Understand', n:'01',
    frSub:'À quoi sert xOrus ?', enSub:'What is xOrus for?' },
  { path: '/intelligence/agents', fr:'Les agents', en:'Agents', n:'02',
    frSub:'Qui fait quoi ?', enSub:'Who does what?' },
  { path: '/intelligence/lab', fr:'Expérimenter', en:'Experiment', n:'03',
    frSub:'Tester sans risque', enSub:'Try without risk' },
] as const

export default function IntelligencePath() {
  const { lang } = useI18n()
  const { pathname } = useLocation()
  const fr=lang==='fr'
  return (
    <nav className="xa-intelligence-path" aria-label={fr?'Parcours Intelligence xOrus':'xOrus intelligence journey'}>
      {steps.map(step=>{
        const selected=pathname===step.path || pathname===step.path+'/' ||
          (step.path.endsWith('/xorus')&&['/xorus','/lia'].includes(pathname)) ||
          (step.path.endsWith('/agents')&&['/agents','/packs'].includes(pathname)) ||
          (step.path.endsWith('/lab')&&['/lab','/labo'].includes(pathname))
        return <Link key={step.path} to={step.path} className="xa-intelligence-step"
          aria-current={selected?'page':undefined} data-current={selected?'true':'false'}>
          <span className="xa-intelligence-step-number">{step.n}</span>
          <span><strong>{fr?step.fr:step.en}</strong>
            <small>{fr?step.frSub:step.enSub}</small></span>
        </Link>
      })}
    </nav>
  )
}
