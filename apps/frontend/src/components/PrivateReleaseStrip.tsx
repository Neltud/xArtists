import { Link } from 'react-router-dom'

/**
 * Bandeau discret — ton produit, sans jargon technique.
 */
export default function PrivateReleaseStrip() {
  return (
    <div className="w-full border-b border-violet-500/20 bg-violet-950/40 px-3 py-1.5 text-center text-[11px] text-violet-200/90">
      Exploration LIA · on-chain progressif · pas de promesse de performance
      <span className="mx-2 text-violet-600">·</span>
      <Link to="/legal" className="underline text-violet-100/90 hover:text-white">
        Mentions
      </Link>
      <span className="mx-1 text-violet-600">/</span>
      <Link to="/lia" className="underline text-violet-100/90 hover:text-white">
        LIA
      </Link>
      <span className="mx-1 text-violet-600">/</span>
      <Link to="/wallet" className="underline text-violet-100/90 hover:text-white">
        Wallet
      </Link>
    </div>
  )
}
