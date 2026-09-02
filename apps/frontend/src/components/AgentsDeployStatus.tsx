import { Link } from 'react-router-dom'
import { LIA_WALLET } from '../config/links'
import { AGENTS_FEE_BPS, AGENTS_MARKETPLACE_ADDRESS, canBuyAgent } from '../config/scStatus'

/** Agents marketplace readiness — SC gate + Model C path */
export default function AgentsDeployStatus() {
  const live = canBuyAgent()
  const feePct = (AGENTS_FEE_BPS / 100).toFixed(1)

  if (live) {
    return (
      <div className="card mb-6 border-emerald-500/40 bg-emerald-500/10">
        <h2 className="font-bold text-emerald-200 mb-1">Agents marketplace — SC live</h2>
        <p className="text-xs text-emerald-100/90 leading-relaxed">
          Adresse <code className="text-[10px]">{AGENTS_MARKETPLACE_ADDRESS.slice(0, 16)}…</code> · fee{' '}
          {feePct} % · Buy on-chain possible avec wallet user (pas LIA ops).
        </p>
        <p className="text-[11px] text-gray-500 mt-2">
          Access fiat Model C reste sur{' '}
          <Link to="/my-packs" className="text-purple-300 underline">
            My Packs
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="card mb-6 border-amber-500/40 bg-amber-500/10">
      <h2 className="font-bold text-amber-200 mb-1">Agents marketplace — SC non déployé</h2>
      <p className="text-xs text-amber-100/90 leading-relaxed">
        <code>agents_marketplace</code> non live / codeHash KO — <strong>Buy on-chain désactivé</strong>.
        Owner prévu = wallet LIA · FEE_BPS={AGENTS_FEE_BPS} ({feePct} %).
      </p>
      <ul className="text-xs text-gray-400 mt-2 space-y-1 list-disc list-inside">
        <li>
          Après buy on-chain : <strong>clé API limitée</strong> + <strong>NFT badge</strong> + reçu
          explorer
        </li>
        <li>
          Fee reste sur le SC jusqu’à <code>claimFees</code> (owner)
        </li>
        <li>
          Packs Access (Pulse/Yield/Sentinel) ≠ GreenSmoke (prévisions) · fiat →{' '}
          <Link to="/my-packs" className="text-purple-300 underline">
            My Packs
          </Link>
        </li>
      </ul>
      <p className="text-[11px] text-gray-500 mt-2 mono break-all">
        Seller LIA {LIA_WALLET.slice(0, 12)}… ·{' '}
        <code>./scripts/deploy_mainnet.sh agents-marketplace</code>
      </p>
    </div>
  )
}
