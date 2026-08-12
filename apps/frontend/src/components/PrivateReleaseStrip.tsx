import { Link } from 'react-router-dom'

/**
 * Private / early-access honesty strip — no false production claims.
 */
export default function PrivateReleaseStrip() {
  return (
    <div
      className="border-b border-violet-500/20 bg-violet-950/30 px-3 py-1.5 text-center text-[11px] text-violet-200/90"
      role="status"
    >
      <span className="font-semibold text-violet-100">Private release</span>
      <span className="mx-1.5 text-violet-500">·</span>
      Paper LIA · market on-chain seulement après codeHash · pas de promesse de performance
      <span className="mx-1.5 text-violet-500">·</span>
      <Link to="/marketplace" className="underline text-violet-100/90 hover:text-white">
        Market
      </Link>
      <span className="mx-1 text-violet-600">/</span>
      <Link to="/portfolio" className="underline text-violet-100/90 hover:text-white">
        LIA
      </Link>
      <span className="mx-1 text-violet-600">/</span>
      <Link to="/wallet" className="underline text-violet-100/90 hover:text-white">
        Wallet
      </Link>
    </div>
  )
}
