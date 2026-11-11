import { lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

const Simulation = lazy(() => import('./SimulationLab'))
const Network = lazy(() => import('./EntityMap'))
const SculptureTurntable = lazy(() => import('../components/ArtworkTurntableLab'))

export default function LabPage() {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'network' ? 'network' : params.get('view') === '3d' ? '3d' : 'simulation'
  const select = (next: string) => {
    const updated = new URLSearchParams(params)
    updated.set('view', next)
    setParams(updated)
  }
  return <section className="xa-lab">
    <header>
      <h1>{fr ? 'Laboratoire' : 'Laboratory'}</h1>
      <p>{fr ? 'Explorez les simulations xOrus, le réseau et la rotation de sculptures photographiées. La rotation locale n’est pas un maillage 3D certifié ni un mint NFT.' : 'Explore xOrus simulations, agent data and local sculpture turntables. A photo turntable is not a certified 3D mesh or NFT mint.'}</p>
      <nav aria-label={fr ? 'Vues du laboratoire' : 'Laboratory views'} className="xa-lab-switch">
        <button type="button" className="xa-button secondary" aria-pressed={view === 'simulation'} onClick={() => select('simulation')}>{fr ? 'Simulations' : 'Simulations'}</button>
        <button type="button" className="xa-button secondary" aria-pressed={view === 'network'} onClick={() => select('network')}>{fr ? 'Réseau xOrus' : 'xOrus network'}</button>
        <button type="button" className="xa-button secondary" aria-pressed={view === '3d'} onClick={() => select('3d')}>{fr ? 'Sculpture 3D' : '3D sculpture'}</button>
        <Link className="xa-button secondary" to="/agents">{fr ? 'Découvrir les agents' : 'Discover agents'}</Link>
        <Link className="xa-button secondary" to="/create/digital-twin">{fr ? 'Photogrammétrie et certificat' : 'Photogrammetry and certificate'}</Link>
        <Link className="xa-button secondary" to="/create/nft-factory">{fr ? 'Préparer un distributeur NFT' : 'Prepare an NFT distributor'}</Link>
      </nav>
    </header>
    <Suspense fallback={<p role="status">{fr ? 'Chargement…' : 'Loading…'}</p>}>
      {view === '3d' ? <SculptureTurntable/> : view === 'network' ? <Network/> : <Simulation/>}
    </Suspense>
  </section>
}
