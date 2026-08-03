import { LIA_WALLET } from '../config/links'

/** Shown when agents_marketplace is null + product copy for post-buy */
export default function AgentsDeployStatus() {
  return (
    <div className="card mb-6 border-amber-500/40 bg-amber-500/10">
      <h2 className="font-bold text-amber-200 mb-1">Agents marketplace — SC non déployé</h2>
      <p className="text-xs text-amber-100/90 leading-relaxed">
        <code>agents_marketplace: null</code> — <strong>Buy désactivé</strong> jusqu’au deploy mainnet
        (owner = wallet LIA, FEE_BPS=300).
      </p>
      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
        Après un buy réussi, l’acheteur reçoit : <strong>clé API limitée</strong> + <strong>NFT badge</strong> +{" "}
        <strong>reçu</strong> (tx explorer). Provisioning Vellum :{" "}
        <code>lia.agents.fulfillment</code>.
      </p>
      <p className="text-[11px] text-gray-500 mt-2 mono break-all">
        Seller officiel possible : LIA {LIA_WALLET.slice(0, 12)}…
      </p>
    </div>
  )
}
