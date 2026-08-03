import { useMultiversX } from '../hooks/useMultiversX'
import { LINKS } from '../config/links'

/**
 * DAO page is READ-ONLY until vote ABI + sdk-dapp sendTx are proven.
 * No fake "Vote" button that implies an on-chain TX.
 */
export default function DAO() {
  const { bonData, xartists, prices } = useMultiversX()

  const daoActive = bonData?.dao_active ?? false
  const proposalTitle = bonData?.current_proposal_title ?? 'Aucune proposal active'
  const voteResults = bonData?.vote_results ?? {}
  const winningPair = bonData?.winning_pair ?? ''
  const totalVotes = bonData?.total_votes_cast ?? 0
  const recommendedPair = bonData?.recommended_pair ?? 'TRO/WEGLD'
  const troStaked = xartists?.staking?.tro_staking_active ?? false
  const nftStaked = xartists?.staking?.nft_staking_active ?? false
  const nftStakedCount = xartists?.staking?.nft_staked_count ?? 0
  const troBalance = xartists?.tro_token?.balance_wallet ?? 0
  const troValueUsd = xartists?.tro_token?.value_usd ?? 0
  const troPrice = prices.tro || xartists?.tro_token?.price_usd || 0

  const pairs = Object.entries(voteResults)

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black">🗳️ Gouvernance DAO xArtists</h1>
        <p className="text-gray-500 mt-1">$TRO · lecture des propositions — vote on-chain pas encore branché</p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <strong>Mode lecture seule (P0 UX).</strong> Aucun bouton « Voter » factice : l’envoi TX gouvernance
        sera activé seulement après ABI vote + signature sdk-dapp validée. En attendant, achetez/stakez $TRO
        via les liens officiels.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Statut DAO</p>
          <p className="text-xl font-bold">{daoActive ? '🟢 Données live' : '⏸️ Standby'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">TRO Staking</p>
          <p className="text-xl font-bold">{troStaked ? '✅ Signal actif' : '⏳ Pending'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Votes (données)</p>
          <p className="text-xl font-bold">{totalVotes.toFixed(2)} TRO</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Reco LIA</p>
          <p className="text-xl font-bold text-yellow-400">{recommendedPair}</p>
        </div>
      </div>

      <div className="card mb-8 border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">$TRO</p>
          <a
            href="https://explorer.multiversx.com/tokens/TRO-94c925"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-500 hover:text-white"
          >
            Explorer ↗
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Prix</p>
            <p className="text-xl font-bold text-purple-400">${troPrice.toFixed(8)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Balance LIA (ops)</p>
            <p className="text-xl font-bold">{troBalance.toFixed(2)} TRO</p>
            <p className="text-xs text-gray-500">≈ ${troValueUsd.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">NFT Staking signal</p>
            <p className="text-xl font-bold">{nftStaked ? '✅' : '⏳'}</p>
            {nftStakedCount > 0 && <p className="text-xs text-gray-500">{nftStakedCount} NFT</p>}
          </div>
          <div>
            <a href={LINKS.xexchangeTroUsdc} target="_blank" rel="noreferrer" className="btn-primary text-sm inline-block">
              Acheter $TRO ↗
            </a>
          </div>
        </div>
      </div>

      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📋</span>
          <div>
            <h2 className="text-lg font-bold">Proposal (aperçu)</h2>
            <p className="text-sm text-gray-400">{proposalTitle}</p>
          </div>
        </div>

        {pairs.length > 0 ? (
          <div className="space-y-3">
            {pairs.map(([pair, data]: [string, any]) => {
              const votes = data.votes ?? 0
              const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
              const isWinning = pair === winningPair
              return (
                <div
                  key={pair}
                  className={`p-4 rounded-xl border ${
                    isWinning ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-[#2a2a3a] bg-[#111118]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">
                      {pair} {isWinning && '🏆'}
                    </span>
                    <span className="text-sm text-gray-400">
                      {pct.toFixed(1)}% ({votes.toFixed(2)} TRO)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: isWinning
                          ? 'linear-gradient(90deg, #d97706, #dc2626)'
                          : 'linear-gradient(90deg, #7c3aed, #2563eb)',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.description} · Risque: {data.risk}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-2">Pas de vote on-chain depuis cette UI (P0).</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Aucune proposal chargée</p>
            <p className="text-sm mt-1">Les résultats s’afficheront en lecture seule quand les données JSON seront à jour</p>
          </div>
        )}
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">Prochaines étapes (quand TX vote live)</h2>
        <ol className="list-decimal list-inside text-sm text-gray-400 space-y-2">
          <li>Acheter $TRO sur xExchange</li>
          <li>Stake sur contrat governance (via explorer / app dédiée)</li>
          <li>Activer bouton Vote ici seulement après tests blackbox</li>
        </ol>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4">Contrats (référence)</h2>
        <div className="space-y-2">
          {[
            { name: 'TRO Governance', addr: 'erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8' },
            { name: 'NFT Staking', addr: 'erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl' },
          ].map(c => (
            <div key={c.addr} className="flex items-center justify-between p-3 rounded-lg bg-[#111118]">
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs mono text-gray-500">{c.addr.slice(0, 28)}…</p>
              </div>
              <a
                href={`https://explorer.multiversx.com/accounts/${c.addr}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Explorer
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
