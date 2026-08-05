import { Link } from 'react-router-dom'
import { LIA_WALLET, LINKS } from '../config/links'

/**
 * xArtists Editions — monthly letter (art · culture · tech + édito vision).
 * Not a yield product.
 */
export default function Editions() {
  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-2">📰 xArtists Editions</h1>
      <p className="text-gray-500 text-sm mb-6">
        Lettre <strong className="text-gray-300">mensuelle</strong> : art · culture · technologie + édito vision
        xArtists. Abonnement — <strong>pas un investissement</strong>.
      </p>

      <div className="card mb-6 space-y-3">
        <h2 className="font-bold">Contenu type</h2>
        <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
          <li>Sélection d’œuvres / drops phygital</li>
          <li>Culture & scène art contemporain × crypto</li>
          <li>Tech MultiversX / outils créateurs</li>
          <li>Édito vision fondation xArtists</li>
        </ul>
      </div>

      <div className="card border-purple-500/25 mb-6">
        <h2 className="font-bold mb-2">S’abonner (V1)</h2>
        <p className="text-xs text-gray-500 mb-3">
          Stripe / carte = bientôt. En attendant : tip EGLD vers LIA Ops avec memo{' '}
          <code className="text-purple-300">sub:editions</code>.
        </p>
        <p className="mono text-[10px] break-all text-gray-400 mb-2">{LIA_WALLET}</p>
        <div className="flex flex-wrap gap-2">
          <a href={LINKS.explorerAccount(LIA_WALLET)} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            Explorer
          </a>
          <Link to="/tip" className="btn-primary text-sm">
            Tip / payer
          </Link>
        </div>
      </div>
    </div>
  )
}
