import { lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import IntelligencePath from '../components/intelligence/IntelligencePath'

const Simulation = lazy(() => import('./SimulationLab'))
const Network = lazy(() => import('./EntityMap'))
const SculptureTurntable = lazy(() => import('../components/ArtworkTurntableLab'))

type LabView = 'simulation' | 'network' | '3d'

export default function LabPage() {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const [params, setParams] = useSearchParams()
  const view: LabView = params.get('view') === 'network' ? 'network' : params.get('view') === '3d' ? '3d' : 'simulation'
  const select = (next: LabView) => {
    const updated = new URLSearchParams(params)
    updated.set('view', next)
    setParams(updated)
  }
  return <div className="xa-intelligence-layout">
    <IntelligencePath />
    <section className="xa-lab !p-0">
      <header className="xa-intelligence-hero">
        <p className="xa-intelligence-eyebrow">{fr ? '03 · Tester et comprendre' : '03 · Try and understand'}</p>
        <h1>{fr ? 'Le laboratoire xOrus' : 'The xOrus laboratory'}</h1>
        <p>{fr
          ? 'Choisissez une seule expérience. Tout ce qui se passe ici est une démonstration locale : aucun ordre réel, aucune transaction, aucun NFT généré.'
          : 'Choose one experience. Everything here is a local demonstration: no live order, transaction, or NFT is created.'}</p>
        <p role="status" className="xa-intelligence-status">{fr
          ? 'Mode démonstration · aucune donnée de performance réelle et aucun wallet requis.'
          : 'Demo mode · no real performance data and no wallet required.'}</p>
      </header>

      <section className="mt-5" aria-label={fr ? 'Choisir une expérience' : 'Choose an experiment'}>
        <h2 className="mb-3 text-lg font-semibold">{fr ? 'Que voulez-vous essayer ?' : 'What would you like to try?'}</h2>
        <nav aria-label={fr ? 'Vues du laboratoire' : 'Laboratory views'} className="xa-lab-switch">
          <button type="button" className="xa-button secondary" aria-pressed={view === 'simulation'} onClick={() => select('simulation')}>
            {fr ? '1 · Comprendre une simulation' : '1 · Understand a simulation'}
          </button>
          <button type="button" className="xa-button secondary" aria-pressed={view === 'network'} onClick={() => select('network')}>
            {fr ? '2 · Explorer les connexions' : '2 · Explore connections'}
          </button>
          <button type="button" className="xa-button secondary" aria-pressed={view === '3d'} onClick={() => select('3d')}>
            {fr ? '3 · Atelier sculpture (création)' : '3 · Sculpture workshop (creation)'}
          </button>
        </nav>
      </section>

      <section className="mt-5 min-w-0" aria-label={fr ? 'Expérience sélectionnée' : 'Selected experiment'}>
        <div className="xa-intelligence-card mb-4">
          <h2>{view === 'simulation'
            ? (fr ? 'Simulation pédagogique' : 'Educational simulation')
            : view === 'network' ? (fr ? 'Carte des modules xArtists' : 'xArtists module map')
            : (fr ? 'Prévisualiser une sculpture' : 'Preview a sculpture')}</h2>
          <p>{view === 'simulation'
            ? (fr ? 'Les chiffres sont créés par le navigateur pour expliquer le risque. Ils ne proviennent pas d’un agent en direct.' : 'The browser generates example numbers to explain risk. They are not live agent observations.')
            : view === 'network' ? (fr ? 'Cette carte décrit les composants et leurs liens. Un lien sur la carte ne prouve pas qu’un service est actif.' : 'This map shows components and their relationships. An edge does not prove a service is live.')
            : (fr ? 'Un plateau tournant photographique aide à présenter une œuvre. Ce n’est ni un scan 3D ni une publication NFT.' : 'A photographic turntable can present art. It is not a 3D scan or an NFT publication.')}</p>
        </div>
        {view === '3d' && <p role="note" className="xa-intelligence-note mb-4">{fr
          ? 'La rotation locale n’est pas un maillage 3D certifié ni un mint NFT. Étapes réelles : média vérifié → IPFS confirmé → mint signé dans Studio.'
          : 'Local photo rotation is neither a certified mesh nor an NFT mint. Actual path: verified media → confirmed IPFS → signed mint in Studio.'}</p>}
        <Suspense fallback={<p role="status" className="xa-intelligence-card">{fr ? 'Chargement de l’expérience…' : 'Loading the experiment…'}</p>}>
          {view === '3d' ? <SculptureTurntable/> : view === 'network' ? <Network/> : <Simulation/>}
        </Suspense>
      </section>

      <details className="xa-intelligence-advanced mt-6">
        <summary>{fr ? 'Autres outils et étapes de création' : 'Other tools and creation steps'}</summary>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="xa-button secondary" to="/agents">{fr ? 'Comprendre les agents' : 'Meet the agents'}</Link>
          <Link className="xa-button secondary" to="/create/digital-twin">{fr ? 'Photogrammétrie et certificat' : 'Photogrammetry and certificate'}</Link>
          <Link className="xa-button primary" to="/studio?mode=sculpture">{fr ? 'Préparer le NFT de ma sculpture' : 'Prepare a sculpture NFT'}</Link>
          <Link className="xa-button secondary" to="/create/nft-factory">{fr ? 'Distributeur NFT (préparation)' : 'NFT distributor (preview)'}</Link>
        </div>
      </details>
    </section>
  </div>
}
