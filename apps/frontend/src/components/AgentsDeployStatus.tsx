/** Shown when agents_marketplace is null */
export default function AgentsDeployStatus() {
  return (
    <div className="card mb-6 border-amber-500/40 bg-amber-500/10">
      <h2 className="font-bold text-amber-200 mb-1">Agents marketplace — SC non déployé</h2>
      <p className="text-xs text-amber-100/90">
        <code>data/contracts.json → agents_marketplace: null</code>. Buy agents bloqué jusqu’au deploy
        mainnet (<code>FEE_BPS=300</code>) puis <code>VITE_AGENTS_MARKETPLACE_ADDRESS</code> + rebuild
        Pages.
      </p>
      <p className="text-[11px] text-gray-500 mt-2">
        Ops: <code>./scripts/deploy_mainnet.sh</code> · blackbox · update contracts.json
      </p>
    </div>
  )
}
