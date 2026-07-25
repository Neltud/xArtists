import { useMultiversX } from '../hooks/useMultiversX'

export default function DAO() {
  const { bonData, xartists } = useMultiversX()

  const daoActive = bonData?.dao_active ?? false
  const proposalTitle = bonData?.current_proposal_title ?? 'Aucune proposal active'
  const voteResults = bonData?.vote_results ?? {}
  const winningPair = bonData?.winning_pair ?? ''
  const totalVotes = bonData?.total_votes_cast ?? 0
  const recommendedPair = bonData?.recommended_pair ?? 'TRO/WEGLD'
  const troStaked = xartists?.staking?.tro_staking_active ?? false

  const pairs = Object.entries(voteResults)

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black">🗳️ Gouvernance DAO xArtists</h1>
        <p className="text-gray-500 mt-1">Voting on-chain avec $TRO — Quorum 60% | Durée 24h</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Statut DAO</p>
          <p className="text-xl font-bold">{daoActive ? '🟢 Actif' : '⏸️ Standby'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">TRO Staking</p>
          <p className="text-xl font-bold">{troStaked ? '✅ Actif' : '⏳ Pending'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Votes</p>
          <p className="text-xl font-bold">{totalVotes.toFixed(2)} TRO</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Recommandation LIA</p>
          <p className="text-xl font-bold text-yellow-400">{recommendedPair}</p>
        </div>
      </div>

      {/* Proposal active */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📋</span>
          <div>
            <h2 className="text-lg font-bold">Proposal Active</h2>
            <p className="text-sm text-gray-400">{proposalTitle}</p>
          </div>
        </div>

        {pairs.length > 0 ? (
          <div className="space-y-3">
            {pairs.map(([pair, data]: [string, any]) => {
              const votes = data.votes ?? 0
              const pct = totalVotes > 0 ? votes / totalVotes * 100 : 0
              const isWinning = pair === winningPair
              return (
                <div
                  key={pair}
                  className={`p-4 rounded-xl border transition-all ${
                    isWinning ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-[#2a2a3a] bg-[#111118]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">{pair} {isWinning && '🏆'}</span>
                    <span className="text-sm text-gray-400">{pct.toFixed(1)}% ({votes.toFixed(2)} TRO)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: isWinning ? 'linear-gradient(90deg, #d97706, #dc2626)' : 'linear-gradient(90deg, #7c3aed, #2563eb)',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{data.description} • Risque: {data.risk}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-3">🗳️</p>
            <p>Aucun vote actif pour le moment</p>
            <p className="text-sm mt-1">Stakez vos TRO pour participer à la prochaine proposal</p>
          </div>
        )}
      </div>

      {/* Comment voter */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">💡 Comment voter</h2>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Achetez $TRO sur xExchange (TRO-94c925)', icon: '🛒' },
            { step: '2', text: 'Stakez vos TRO dans le contrat TRO Governance', icon: '🔒' },
            { step: '3', text: 'Votez pour la paire de liquidité de votre choix', icon: '🗳️' },
            { step: '4', text: 'LIA réinvestit 50% des profits dans la paire gagnante', icon: '🤖' },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-4 p-3 rounded-xl bg-[#111118]">
              <span className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</span>
              <span className="text-xl">{s.icon}</span>
              <p className="text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contrats */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">🔗 Contrats Governance</h2>
        <div className="space-y-2">
          {[
            { name: 'TRO Governance', addr: 'erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8' },
            { name: 'NFT Staking', addr: 'erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl' },
          ].map(c => (
            <div key={c.addr} className="flex items-center justify-between p-3 rounded-lg bg-[#111118]">
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs mono text-gray-500">{c.addr.slice(0, 24)}...</p>
              </div>
              <a href={`https://explorer.multiversx.com/accounts/${c.addr}`} target="_blank" rel="noreferrer" className="btn-secondary text-xs px-3 py-1.5">Explorer</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
