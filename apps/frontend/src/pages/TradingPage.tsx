import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** Desk trading — paper LIA + accès salles pack. */
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useAgentAccess } from '../store/empireStore'
import { requestOpenConnect } from '../lib/walletEvents'

export default function TradingPage() {
  const { connected } = useWallet()
  const access = useAgentAccess()

  return (
    <div className="xa-page animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">{xaRender("Desk")}</p>
        <h1 className="section-title display text-2xl">{xaRender("Trading")}</h1>
        <p className="text-sm text-zinc-400">
          {xaRender("Signaux LIA en simulation. Pas de mandat, pas de promesse de performance. ")}</p>
      </header>

      <div className="card space-y-3 text-sm text-zinc-300">
        <p>
          {xaRender("Accès packs :")}{xaRender(' ')}
          {xaRender(access.packs.length ? access.packs.join(' · ') : 'aucun — ouvre un pack')}
        </p>
        {xaRender(!connected && (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            {xaRender("Connecter wallet ")}</button>
        ))}
        <div className="flex flex-wrap gap-2">
          <Link to="/my-packs" className="btn-primary text-sm">
            {xaRender("Mes salles ")}</Link>
          <Link to="/command-center" className="btn-secondary text-sm">
            {xaRender("Command Center ")}</Link>
          <Link to="/lia" className="btn-secondary text-sm">
            {xaRender("LIA ")}</Link>
        </div>
      </div>
    </div>
  )
}
