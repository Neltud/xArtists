import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
import { Link } from 'react-router-dom'
import { LIA_WALLET, LINKS } from '../config/links'
import PageGuide from '../components/PageGuide'

/**
 * xArtists Editions — monthly letter (art · culture · tech + édito vision).
 * Not a yield product.
 */
export default function Editions() {
  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <PageGuide page="editions" />

      <h1 className="text-3xl font-black mb-2">{xaRender("📰 xArtists Editions")}</h1>
      <p className="text-gray-500 text-sm mb-6">
        {xaRender("Lettre ")}<strong className="text-gray-300">{xaRender("mensuelle")}</strong> {xaRender(" : art · culture · technologie + édito vision xArtists. Abonnement — ")}<strong>{xaRender("pas un investissement")}</strong>.
      </p>

      <div className="card mb-6 space-y-3">
        <h2 className="font-bold">{xaRender("Contenu type")}</h2>
        <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
          <li>{xaRender("Sélection d’œuvres / drops phygital")}</li>
          <li>{xaRender("Culture & scène art contemporain × crypto")}</li>
          <li>{xaRender("Tech MultiversX / outils créateurs")}</li>
          <li>{xaRender("Édito vision fondation xArtists")}</li>
        </ul>
      </div>

      <div className="card border-purple-500/25 mb-6">
        <h2 className="font-bold mb-2">{xaRender("S’abonner (V1)")}</h2>
        <p className="text-xs text-gray-500 mb-3">
          {xaRender("Stripe / carte = bientôt. En attendant : tip EGLD on-chain avec memo")}{xaRender(' ')}
          <code className="text-purple-300">tip:mission</code> {xaRender(" ou copie manuelle + memo")}{xaRender(' ')}
          <code className="text-purple-300">sub:editions</code>.
        </p>
        <p className="mono text-[10px] break-all text-gray-400 mb-2">{xaRender(LIA_WALLET)}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={LINKS.explorerAccount(LIA_WALLET)}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm"
          >
            {xaRender("Explorer ")}</a>
          <Link to="/tip" className="btn-primary text-sm">
            {xaRender("Tip on-chain → ")}</Link>
          <Link to="/gallery" className="btn-secondary text-sm">
            {xaRender("Galerie ")}</Link>
        </div>
      </div>

      <p className="text-xs text-zinc-600 text-center">
        {xaRender("Pas de promesse de rendement · fondation par l’usage (fees, tips, LIA paper) ")}</p>
    </div>
  )
}
