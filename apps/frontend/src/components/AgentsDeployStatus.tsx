import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
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
        <h2 className="font-bold text-emerald-200 mb-1">{xaRender("Agents marketplace — SC live")}</h2>
        <p className="text-xs text-emerald-100/90 leading-relaxed">
          {xaRender("Adresse ")}<code className="text-[10px]">{AGENTS_MARKETPLACE_ADDRESS.slice(0, 16)}…</code> {xaRender(" · fee")}{xaRender(' ')}
          {xaRender(feePct)} {xaRender(" % · Buy on-chain possible avec wallet user (pas LIA ops). ")}</p>
        <p className="text-[11px] text-gray-500 mt-2">
          {xaRender("Access fiat Model C reste sur")}{xaRender(' ')}
          <Link to="/my-packs" className="text-purple-300 underline">
            {xaRender("My Packs ")}</Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="card mb-6 border-amber-500/40 bg-amber-500/10">
      <h2 className="font-bold text-amber-200 mb-1">{xaRender("Agents marketplace — SC non déployé")}</h2>
      <p className="text-xs text-amber-100/90 leading-relaxed">
        <code>agents_marketplace</code> {xaRender(" non live / codeHash KO — ")}<strong>{xaRender("Buy on-chain désactivé")}</strong>{xaRender(". Owner prévu = wallet LIA · FEE_BPS=")}{xaRender(AGENTS_FEE_BPS)} ({xaRender(feePct)} %).
      </p>
      <ul className="text-xs text-gray-400 mt-2 space-y-1 list-disc list-inside">
        <li>
          {xaRender("Après buy on-chain : ")}<strong>{xaRender("clé API limitée")}</strong> + <strong>{xaRender("NFT badge")}</strong> {xaRender(" + reçu explorer ")}</li>
        <li>
          {xaRender("Fee reste sur le SC jusqu’à ")}<code>claimFees</code> {xaRender(" (owner) ")}</li>
        <li>
          {xaRender("Packs Access (Pulse/Yield/Sentinel) ≠ GreenSmoke (prévisions) · fiat →")}{xaRender(' ')}
          <Link to="/my-packs" className="text-purple-300 underline">
            {xaRender("My Packs ")}</Link>
        </li>
      </ul>
      <p className="text-[11px] text-gray-500 mt-2 mono break-all">
        {xaRender("Seller LIA ")}{xaRender(LIA_WALLET.slice(0, 12))}… ·{xaRender(' ')}
        <code>./scripts/deploy_mainnet.sh agents-marketplace</code>
      </p>
    </div>
  )
}
