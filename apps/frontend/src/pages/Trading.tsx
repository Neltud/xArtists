import { useMultiversX } from '../hooks/useMultiversX'

export default function Trading() {
  const { prices, liaStatus, bonData, loading } = useMultiversX()

  const guard = liaStatus?.market?.guard_status ?? 'OK'
  const guardColor = guard === 'OK' ? 'text-green-400' : guard === 'WARNING' ? 'text-orange-400' : 'text-red-400'

  const pools = bonData?.xexchange_pools ?? []
  const winningPair = bonData?.winning_pair ?? 'TRO/WEGLD'
  const recommendedPair = bonData?.recommended_pair ?? 'TRO/WEGLD'

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black">⚡ Trading Terminal LIA</h1>
        <p className="text-gray-500 mt-1">Signaux temps réel, analyse $TRO, exécution autonome</p>
      </div>

      {/* Signal LIA */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">🧠 Signal LIA v6</p>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-black text-gray-400">⏸️</div>
            <div>
              <p className="text-2xl font-bold">MONITORING</p>
              <p className="text-sm text-gray-500">Cycle automatique toutes les heures</p>
              <span className={`badge-gray mt-2 ${guardColor}`}>Guard: {guard}</span>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[#111118] text-xs text-gray-400">
            LIA v6 exécute automatiquement les trades via Vellum Workflows.
            Les signaux sont générés par LIABrain + UniversalBrain TP1/TP3/TP5.
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">🪙 Analyse $TRO</p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Prix $TRO</span>
              <span className="mono font-bold text-purple-400">${prices.tro.toFixed(8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Identifier</span>
              <span className="mono text-sm">TRO-94c925</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Pools actives</span>
              <span className="font-bold">{pools.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Meilleure pool</span>
              <span className="font-bold text-green-400">{winningPair || 'TRO/WEGLD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Recommandation LIA</span>
              <span className="font-bold text-yellow-400">{recommendedPair}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stratégies */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">📊 Stratégies LIA v6</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: 'TP1 Scalping', tp: '+1%', sl: '-0.5%', desc: 'Scalping rapide', color: 'border-orange-500/30 text-orange-400' },
            { name: 'TP3 Swing Court', tp: '+3%', sl: '-1.5%', desc: 'Swing court terme', color: 'border-cyan-500/30 text-cyan-400' },
            { name: 'TP5 Swing Moyen', tp: '+5%', sl: '-2.5%', desc: 'Swing moyen terme', color: 'border-purple-500/30 text-purple-400' },
            { name: 'LIA Brain WBTC', tp: '+15%', sl: '-8%', desc: 'Bitcoin wrappé', color: 'border-yellow-500/30 text-yellow-400' },
            { name: 'LIA Brain wTAO', tp: '+20%', sl: '-10%', desc: 'Bittensor', color: 'border-green-500/30 text-green-400' },
            { name: 'Contrarian', tp: '+0.5%', sl: '-1%', desc: 'Contre-tendance', color: 'border-pink-500/30 text-pink-400' },
          ].map(s => (
            <div key={s.name} className={`p-4 rounded-xl bg-[#111118] border ${s.color.split(' ')[0]}`}>
              <p className={`font-bold text-sm ${s.color.split(' ')[1]}`}>{s.name}</p>
              <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
              <div className="flex gap-3 mt-3">
                <span className="badge-green text-xs">TP {s.tp}</span>
                <span className="badge-red text-xs">SL {s.sl}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pools TRO */}
      {pools.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold mb-4">💧 Pools $TRO xExchange</h2>
          <div className="space-y-2">
            {pools.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#111118]">
                <span className="font-semibold text-sm">{p.pair_name}</span>
                <span className="text-green-400 font-bold">${(p.tvl_usd ?? 0).toFixed(2)} TVL</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEX Links */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">🔀 DEX Mainnet</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: 'xExchange', url: 'https://xexchange.com/swap/USDC-c76f1f/TRO-94c925', icon: '🔵' },
            { name: 'OneDex', url: 'https://onedex.app', icon: '🟠' },
            { name: 'JEXchange', url: 'https://app.jexchange.io', icon: '🟡' },
            { name: 'AshSwap', url: 'https://ashswap.io', icon: '🔥' },
            { name: 'XOXNO', url: 'https://xoxno.com', icon: '🖼️' },
            { name: 'Hatom', url: 'https://hatom.com', icon: '🏦' },
          ].map(d => (
            <a key={d.name} href={d.url} target="_blank" rel="noreferrer" className="btn-secondary text-center text-sm">
              {d.icon} {d.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
