import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
import { Link } from 'react-router-dom'

/**
 * Permanent clarity: protocol LIA ≠ connected user wallet.
 * Use on Portfolio, Trading, Tip, Home strips.
 */
export default function LiaVsUserBanner({
  tone = 'protocol',
}: {
  tone?: 'protocol' | 'user'
}) {
  if (tone === 'user') {
    return (
      <div
        className="mb-6 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-xs text-green-100/90 leading-relaxed"
        role="note"
      >
        <strong className="text-green-200">{xaRender("Mon wallet (utilisateur)")}</strong> {xaRender(" — soldes de l’adresse Connect uniquement. La treasury et le board LIA sont sur")}{xaRender(' ')}
        <Link to="/portfolio" className="underline text-green-50">
          {xaRender("Portfolio protocole ")}</Link>
        .
      </div>
    )
  }

  return (
    <div
      className="mb-6 rounded-xl border border-purple-500/30 bg-purple-500/5 px-4 py-3 text-xs text-purple-100/90 leading-relaxed"
      role="note"
    >
      <strong className="text-purple-200">{xaRender("LIA protocole")}</strong> {xaRender(" — book ops / paper / tips destination. Ce n’est ")}<strong>{xaRender("pas")}</strong> {xaRender(" ton portefeuille personnel.")}{xaRender(' ')}
      <Link to="/wallet" className="underline text-purple-50">
        {xaRender("Mon wallet Connect → ")}</Link>{xaRender(' ')}
      ·{xaRender(' ')}
      <Link to="/my-packs" className="underline text-purple-50">
        {xaRender("My Packs (access paper) ")}</Link>
      .
    </div>
  )
}
