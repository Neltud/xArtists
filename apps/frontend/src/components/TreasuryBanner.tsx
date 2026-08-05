import { Link } from 'react-router-dom'
import { LIA_WALLET, LINKS } from '../config/links'

/**
 * Clarifies LIA Ops vs Mission/Reserve (TREASURY_POLICY) vs user wallet.
 */
export default function TreasuryBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[11px] text-gray-500">
        Fonds protocole = <span className="text-purple-300">LIA Ops</span> · Mission/Reserve à créer ·{' '}
        <Link to="/dao" className="underline text-gray-400">
          Policy
        </Link>
      </p>
    )
  }
  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-100/90 space-y-1">
      <p className="font-semibold text-amber-200">Treasury · transparence</p>
      <p>
        Aujourd’hui les liquidités protocole sont sur{' '}
        <a
          href={LINKS.explorerAccount(LIA_WALLET)}
          target="_blank"
          rel="noreferrer"
          className="mono text-purple-300 underline"
        >
          LIA Ops
        </a>{' '}
        (~faible solde EGLD). <strong>Mission</strong> et <strong>Reserve</strong> multisig = à créer
        (docs/TREASURY_POLICY.md). Ce n’est pas ton wallet Connect.
      </p>
      <p className="text-gray-500">
        Fees market on-chain = après deploy SC · tips / ads → split policy · pas de parts de fonds.
      </p>
    </div>
  )
}
