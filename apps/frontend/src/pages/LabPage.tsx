import { lazy, Suspense } from 'react'
import './lab-page.css'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

const Simulation = lazy(() => import('./SimulationLab'))
const Network = lazy(() => import('./EntityMap'))

export default function LabPage() {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'network' ? 'network' : 'simulation'
  const select = (next: string) => {
    const updated = new URLSearchParams(params)
    updated.set('view', next)
    setParams(updated)
  }
  return <section className="xa-lab">
    <header>
      <h1>{fr ? 'Laboratoire' : 'Laboratory'}</h1>
      <p>{fr ? 'Explorez les simulations et le réseau d’agents au même endroit. Les résultats simulés ne sont pas des transactions mainnet.' : 'Explore simulations and the agent network in one place. Simulated results are not mainnet transactions.'}</p>
      <nav aria-label={fr ? 'Vues du laboratoire' : 'Laboratory views'} className="xa-lab-switch">
        <button type="button" className="xa-button secondary" aria-pressed={view === 'simulation'} onClick={() => select('simulation')}>{fr ? 'Simulations' : 'Simulations'}</button>
        <button type="button" className="xa-button secondary" aria-pressed={view === 'network'} onClick={() => select('network')}>{fr ? 'Réseau d’agents' : 'Agent network'}</button>
        <Link className="xa-button secondary" to="/agents">{fr ? 'Découvrir les agents' : 'Discover agents'}</Link>
        <Link className="xa-button secondary" to="/create/nft-factory">{fr ? 'Préparer un distributeur NFT' : 'Prepare an NFT distributor'}</Link>
      </nav>
    </header>
    <Suspense fallback={<p role="status">{fr ? 'Chargement…' : 'Loading…'}</p>}>
      {view === 'network' ? <Network/> : <Simulation/>}
    </Suspense>
  </section>
}
