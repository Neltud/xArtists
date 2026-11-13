import { lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import IntelligencePath from '../components/intelligence/IntelligencePath'

const Analysis = lazy(() => import('../components/intelligence/XorusDecisionDesk'))
const Simulation = lazy(() => import('./SimulationLab'))
const Network = lazy(() => import('./EntityMap'))
const SculptureTurntable = lazy(() => import('../components/ArtworkTurntableLab'))

type LabView = 'analysis' | 'simulation' | 'network' | '3d'

export default function LabPage() {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const [params, setParams] = useSearchParams()
  const view: LabView = params.get('view') === 'network' ? 'network' : params.get('view') === '3d' ? '3d' : params.get('view') === 'simulation' ? 'simulation' : 'analysis'
  const select = (next: LabView) => {
    const updated = new URLSearchParams(params)
    updated.set('view', next)
    setParams(updated)
  }
  return <div className="xa-intelligence-layout">
    <IntelligencePath />
    <section className="xa-lab !p-0">
      <header className="xa-intelligence-hero">
        <p className="xa-intelligence-eyebrow">{fr ? '03 · Analyser et expérimenter' : '03 · Analyze and explore'}</p>
        <h1>{fr ? 'Le laboratoire xOrus' : 'The xOrus laboratory'}</h1>
        <p>{fr
          ? 'L’analyse xOrus présente des observations serveur horodatées lorsqu’elles sont disponibles. Les simulations et l’atelier 3D restent séparés. Aucun ordre, achat ou NFT n’est envoyé.'
          : 'xOrus presents dated server observations when available. Simulations and the 3D workshop are separate. No order, purchase or NFT is sent.'}</p>
        <p role="status" className="xa-intelligence-status">{fr
          ? 'Lecture seule · décision paper · aucune attestation indépendante des signaux · aucun wallet requis.'
          : 'Read only · paper decision · no independently verified signals · no wallet required.'}</p>
      </header>

      <section className="mt-5" aria-label={fr ? 'Choisir une expérience' : 'Choose an experiment'}>
        <h2 className="mb-3 text-lg font-semibold">{fr ? 'Quel outil souhaitez-vous ouvrir ?' : 'Which tool would you like to open?'}</h2>
        <nav aria-label={fr ? 'Vues du laboratoire' : 'Laboratory views'} className="xa-lab-switch">
          <button type="button" className="xa-button secondary" aria-pressed={view === 'analysis'} onClick={() => select('analysis')}>
            {fr ? 'Analyse xOrus' : 'xOrus analysis'}
          </button>
          <button type="button" className="xa-button secondary" aria-pressed={view === 'simulation'} onClick={() => select('simulation')}>
            {fr ? 'Simulation' : 'Simulation'}
          </button>
          <button type="button" className="xa-button secondary" aria-pressed={view === 'network'} onClick={() => select('network')}>
            {fr ? 'Connexions' : 'Connections'}
          </button>
          <button type="button" className="xa-button secondary" aria-pressed={view === '3d'} onClick={() => select('3d')}>
            {fr ? 'Sculpture 3D' : '3D sculpture'}
          </button>
        </nav>
      </section>

      <section className="mt-5 min-w-0" aria-label={fr ? 'Expérience sélectionnée' : 'Selected experiment'}>
        <div className="xa-intelligence-card mb-4">
          <h2>{view === 'analysis'
            ? (fr ? 'Analyse et décision xOrus' : 'xOrus analysis and decision')
            : view === 'simulation'
              ? (fr ? 'Simulation pédagogique' : 'Educational simulation')
            : view === 'network' ? (fr ? 'Carte des modules xArtists' : 'xArtists module map')
            : (fr ? 'Prévisualiser une sculpture' : 'Preview a sculpture')}</h2>
          <p>{view === 'analysis'
            ? (fr ? 'Rapport dérivé des observations horodatées, si la collecte serveur est disponible. Une source absente n’est jamais remplacée par de faux signaux.' : 'A derived report from dated observations, if server collection is available. Missing sources are never replaced by fabricated signals.')
            : view === 'simulation'
              ? (fr ? 'Les chiffres sont créés par le navigateur pour expliquer le risque. Ils ne proviennent pas d’un agent en direct.' : 'The browser generates example numbers to explain risk. They are not live agent observations.')
            : view === 'network' ? (fr ? 'Cette carte décrit les composants et leurs liens. Un lien sur la carte ne prouve pas qu’un service est actif.' : 'This map shows components and their relationships. An edge does not prove a service is live.')
            : (fr ? 'Un plateau tournant photographique aide à présenter une œuvre. Ce n’est ni un scan 3D ni une publication NFT.' : 'A photographic turntable can present art. It is not a 3D scan or an NFT publication.')}</p>
        </div>
        {view === '3d' && <p role="note" className="xa-intelligence-note mb-4">{fr
          ? 'La rotation locale n’est pas un maillage 3D certifié ni un mint NFT. Étapes réelles : média vérifié → IPFS confirmé → mint signé dans Studio.'
          : 'Local photo rotation is neither a certified mesh nor an NFT mint. Actual path: verified media → confirmed IPFS → signed mint in Studio.'}</p>}
        <Suspense fallback={<p role="status" className="xa-intelligence-card">{fr ? 'Chargement de l’expérience…' : 'Loading the experiment…'}</p>}>
          {view === 'analysis' ? <Analysis/> : view === '3d' ? <SculptureTurntable/> : view === 'network' ? <Network/> : <Simulation/>}
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
