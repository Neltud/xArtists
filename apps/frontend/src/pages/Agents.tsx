import { useEffect, useState } from 'react'
import { fetchMirroredJson } from '../config/dataSources'
import { useAgentsMarketplace } from '../hooks/useAgentsMarketplace'
import WarpButton from '../components/WarpButton'
import { buildBuyAgentWarp, buildListAgentWarp } from '../services/warpService'

interface Forecast {
  asset: string
  direction: string
  target_usd: number | null
  current_ref: number | null
  confidence: number
  horizon: string
  rationale: string
  signal: string
}

interface GsAgent {
  id: string
  name: string
  domain?: string
  domain_fr?: string
  platform: string
  role: string
  status: string
  on_chain_activity?: boolean
  gsn_url?: string
  last_run: string
  confidence_avg: number
  horizon: string
  forecasts: Forecast[]
  example_markets?: string[]
}

interface ForecastData {
  version: string
  updated_at: string
  source: string
  dapp?: string
  token?: { identifier: string; name: string; explorer: string }
  contracts?: Record<string, string>
  agents: Record<string, GsAgent>
  aggregated_signals: {
    primary: string
    secondary: string
    regime: string
    recommended_action: string
    live_feed?: string
    agents_directory?: string
  }
}

interface LimitedAgentEdition {
  id: string
  name: string
  supply: number
  remaining: number
  priceEgld: string
  description: string
}

interface LiaStatusData {
  timestamp?: string
  architecture?: {
    pipeline?: string
    publish?: string
  }
  deploy?: {
    frontend_build?: string
    pages_build_deployment?: string
    base_path?: string
  }
  xartists?: {
    contracts?: {
      agents_marketplace?: string | null
    }
  }
  agents_marketplace?: {
    build_status?: string
    address_source?: string
    frontend_rebuild?: string
    warp_templates?: string[]
  }
  cycle?: {
    summary?: string
  }
}

interface VellumMachineContractData {
  purpose?: string
  frontend_consumers?: Record<string, string[]>
  pipeline?: Array<{
    node: string
    next?: string[]
    calls_before_publish?: string[]
  }>
  gaps_blocking_vellum?: Array<{
    id: string
    priority: number
    issue: string
    fix: string
  }>
}

const DOMAIN_ICON: Record<string, string> = {
  weather: '🌤️',
  crypto: '₿',
  macro: '🌍',
  politics: '🏛️',
  sports: '⚽',
  tech: '💻',
}

const LIA_AGENTS = [
  { key: 'trading', name: 'LIA Trading', icon: '🤖', desc: 'Scalping + Swing + LIABrain', color: 'text-green-400' },
  { key: 'marketplace', name: 'LIA Marketplace', icon: '🎨', desc: 'NFT + RWA + Market Making', color: 'text-purple-400' },
  { key: 'yield', name: 'LIA Yield', icon: '🌾', desc: 'Hatom + xExchange Farms', color: 'text-teal-400' },
  { key: 'security', name: 'LIA Security', icon: '🛡️', desc: 'BalanceGuard + Oracle', color: 'text-blue-400' },
  { key: 'rwa', name: 'LIA RWA Escrow', icon: '🏗️', desc: '$TRO + Arts Physiques', color: 'text-yellow-400' },
  { key: 'dao', name: 'LIA DAO', icon: '🗳️', desc: 'Governance + Proposals', color: 'text-pink-400' },
]

function dirColor(d: string) {
  const x = d.toLowerCase()
  if (x.includes('bull') || x.includes('risk_on') || x === 'buy') return 'text-green-400'
  if (x.includes('bear') || x.includes('risk_off') || x === 'sell') return 'text-red-400'
  return 'text-yellow-400'
}

function signalBadge(s: string) {
  const u = s.toUpperCase()
  if (u.includes('STRONG_BUY') || u.includes('BUY') || u.includes('ACCUMULATE') || u.includes('RISK_ON') || u.includes('LONG'))
    return 'badge-green'
  if (u.includes('SELL') || u.includes('RISK_OFF')) return 'badge-red'
  return 'badge-orange'
}

export default function Agents() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [catalog, setCatalog] = useState<LimitedAgentEdition[]>([])
  const [liaStatus, setLiaStatus] = useState<LiaStatusData | null>(null)
  const [vellumMachine, setVellumMachine] = useState<VellumMachineContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [listAgentId, setListAgentId] = useState('LIA-v6')
  const [listPrice, setListPrice] = useState('0.01')
  const [buyListingId, setBuyListingId] = useState('1')
  const [buyPrice, setBuyPrice] = useState('0.01')
  const [marketplaceMsg, setMarketplaceMsg] = useState<string | null>(null)
  const {
    listAgentAction,
    buyAgentAction,
    pending: marketplacePending,
    error: marketplaceError,
    lastTx: marketplaceLastTx,
    marketplaceAddress,
  } = useAgentsMarketplace()

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [forecastResult, catalogResult, statusResult, machineResult] = await Promise.allSettled([
        fetchMirroredJson<ForecastData>('greensmoke_forecasts.json', { cache: 'no-store', bustCache: true }),
        fetchMirroredJson<LimitedAgentEdition[]>('agents_catalog.json', { cache: 'no-store', bustCache: true }),
        fetchMirroredJson<LiaStatusData>('lia_v6_status.json', { cache: 'no-store', bustCache: true }),
        fetchMirroredJson<VellumMachineContractData>('VELLUM_MACHINE_CONTRACT.json', {
          cache: 'no-store',
          bustCache: true,
        }),
      ])

      if (forecastResult.status !== 'fulfilled' || catalogResult.status !== 'fulfilled') {
        throw new Error('Impossible de charger les données agents / catalogue.')
      }

      setData(forecastResult.value)
      setCatalog(catalogResult.value)
      setLiaStatus(statusResult.status === 'fulfilled' ? statusResult.value : null)
      setVellumMachine(machineResult.status === 'fulfilled' ? machineResult.value : null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 120_000)
    return () => clearInterval(id)
  }, [])

  const agentsList = data ? Object.values(data.agents) : []
  const marketplaceReady = marketplaceAddress.startsWith('erd1')
  const publishedMarketplaceAddress = liaStatus?.xartists?.contracts?.agents_marketplace ?? null
  const publishedMarketplaceReady = Boolean(publishedMarketplaceAddress && publishedMarketplaceAddress.startsWith('erd1'))
  const criticalGaps =
    vellumMachine?.gaps_blocking_vellum?.filter((gap) => gap.priority <= 1).sort((a, b) => a.priority - b.priority) ?? []
  const contractPendingLabel = 'Contrat en déploiement'
  const buyWarp = buildBuyAgentWarp({
    address: marketplaceAddress,
    listingId: parseInt(buyListingId, 10) || 1,
    priceEgld: buyPrice,
  })
  const listWarp = buildListAgentWarp({
    address: marketplaceAddress,
    agentId: listAgentId || 'LIA-v6',
    priceEgld: listPrice,
  })

  const onListAgent = async () => {
    setMarketplaceMsg(null)
    const price = parseFloat(listPrice)
    if (!listAgentId.trim()) {
      setMarketplaceMsg('Agent ID requis')
      return
    }
    if (!(price > 0)) {
      setMarketplaceMsg('Prix EGLD invalide')
      return
    }
    try {
      await listAgentAction({ agentId: listAgentId.trim(), priceEgld: price })
      setMarketplaceMsg('Listing agent soumis — confirme dans le wallet.')
    } catch (e) {
      setMarketplaceMsg(e instanceof Error ? e.message : 'Erreur listing agent')
    }
  }

  const onBuyAgent = async () => {
    setMarketplaceMsg(null)
    const listingId = parseInt(buyListingId, 10)
    const price = parseFloat(buyPrice)
    if (!(listingId > 0) || !(price > 0)) {
      setMarketplaceMsg('Listing ID / prix invalides')
      return
    }
    try {
      await buyAgentAction({ listingId, priceEgld: price })
      setMarketplaceMsg('Achat agent soumis — confirme dans le wallet.')
    } catch (e) {
      setMarketplaceMsg(e instanceof Error ? e.message : 'Erreur achat agent')
    }
  }

  const onBuyCatalogItem = async (listingId: number, priceEgld: string) => {
    setMarketplaceMsg(null)
    const price = parseFloat(priceEgld)
    if (!(listingId > 0) || !(price > 0)) {
      setMarketplaceMsg('Listing ID / prix invalides')
      return
    }
    try {
      await buyAgentAction({ listingId, priceEgld: price })
      setBuyListingId(String(listingId))
      setBuyPrice(priceEgld)
      setMarketplaceMsg('Achat agent soumis — confirme dans le wallet.')
    } catch (e) {
      setMarketplaceMsg(e instanceof Error ? e.message : 'Erreur achat agent')
    }
  }

  return (
    <div className="animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">🧠 Agents IA GreenSmoke</h1>
          <p className="text-sm text-gray-500 mt-1">
            Éditions limitées propulsées par LIA (Vellum) + agents GreenSmoke on-chain
            {data?.updated_at && (
              <span className="ml-2">· MAJ {new Date(data.updated_at).toLocaleString('fr-FR')}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={load} className="btn-secondary text-sm">🔄 Actualiser</button>
          <a
            href={data?.aggregated_signals?.agents_directory || 'https://app.greensmoke.network/agents'}
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-sm"
          >
            GSN Directory ↗
          </a>
        </div>
      </div>

      {data?.aggregated_signals && (
         <div className="card mb-6 border-purple-500/30 bg-purple-500/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-3">📡 Signaux agrégés (utilisables)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500">Primary</p>
              <p className="font-bold text-green-400 text-sm">{data.aggregated_signals.primary}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Secondary</p>
              <p className="font-bold text-purple-400 text-sm">{data.aggregated_signals.secondary}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Régime</p>
              <p className="font-bold text-teal-400 text-sm">{data.aggregated_signals.regime}</p>
            </div>
          </div>
          <p className="text-sm text-gray-300">{data.aggregated_signals.recommended_action}</p>
          {data.aggregated_signals.live_feed && (
            <a href={data.aggregated_signals.live_feed} target="_blank" rel="noreferrer" className="text-xs text-purple-400 mt-2 inline-block">
              Live feed activité agents →
            </a>
          )}
        </div>
      )}

      {/* GSN on-chain */}
      {data?.contracts && (
        <div className="card mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">⛓️ Contrats GreenSmoke Mainnet</p>
          <div className="space-y-1.5 text-[11px] mono text-gray-400">
            {Object.entries(data.contracts).map(([k, addr]) => (
              <div key={k} className="flex flex-col sm:flex-row sm:gap-2 break-all">
                <span className="text-gray-500 shrink-0 w-36">{k}</span>
                <a
                  href={`https://explorer.multiversx.com/accounts/${addr}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  {addr}
                </a>
              </div>
            ))}
          </div>
          {data.token && (
            <a href={data.token.explorer} target="_blank" rel="noreferrer" className="badge-purple mt-3 inline-flex">
              Token {data.token.identifier}
            </a>
          )}
        </div>
      )}

      {loading && !data && (
        <div className="grid gap-4">{[1, 2, 3].map(i => <div key={i} className="card h-32 animate-pulse" />)}</div>
      )}
      {error && <div className="card border-red-500/30 text-red-400 mb-6">Erreur : {error}</div>}

      <div className="card mb-6 border-purple-500/30 bg-purple-500/5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">LIA limited editions</p>
            <h2 className="text-xl font-black">Éditions limitées LIA</h2>
            <p className="text-sm text-gray-400 mt-2">
              Collector passes et accès premium aux agents LIA, avec prix en EGLD et quantité restante affichée clairement.
            </p>
          </div>
          {!marketplaceReady && <span className="badge-orange">{contractPendingLabel}</span>}
        </div>

        {catalog.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2a2a3a] bg-[#111118] px-6 py-10 text-center">
            <p className="text-lg font-semibold text-white">Le catalogue des éditions limitées arrive bientôt.</p>
            <p className="mt-2 text-sm text-gray-400">
              Reviens un peu plus tard pour découvrir les prochaines éditions LIA.
            </p>
            <button type="button" onClick={load} className="btn-secondary mt-5 text-sm">
              Réessayer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {catalog.map((item, index) => {
              const warp = buildBuyAgentWarp({
                address: marketplaceAddress,
                listingId: index + 1,
                priceEgld: item.priceEgld,
              })

              return (
                <div key={item.id} className="rounded-2xl border border-[#2a2a3a] bg-[#111118] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="badge-purple">LIMITED</span>
                      <h3 className="mt-3 text-lg font-bold">{item.name}</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300">
                      {item.remaining} remaining
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-400">{item.description}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-gray-500">Prix EGLD / Price</p>
                      <p className="mt-1 font-semibold text-white">{item.priceEgld} EGLD</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-gray-500">Restant / Remaining</p>
                      <p className="mt-1 font-semibold text-white">{item.remaining}</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-gray-500">Supply / Total</p>
                      <p className="mt-1 font-semibold text-white">{item.supply}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!marketplaceReady || marketplacePending}
                      onClick={() => void onBuyCatalogItem(index + 1, item.priceEgld)}
                      title={!marketplaceReady ? contractPendingLabel : undefined}
                      className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {!marketplaceReady ? contractPendingLabel : 'Acheter / Buy'}
                    </button>
                    <WarpButton warp={warp} filename={`${item.id}.json`} disabled={!marketplaceReady} />
                  </div>
                  {!marketplaceReady && (
                    <p className="mt-2 text-[11px] text-orange-300">
                      {contractPendingLabel} — l’achat sera disponible dès que l’adresse du smart contract sera publiée.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <h2 className="text-lg font-bold mb-3">🔮 Agents prévisionnels GreenSmoke (tes agents)</h2>
      <div className="space-y-4 mb-8">
        {agentsList.map((agent) => (
          <div key={agent.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{DOMAIN_ICON[agent.domain || ''] || '🤖'}</span>
                <div>
                  <p className="font-bold text-lg">{agent.name}</p>
                  <p className="text-xs text-gray-500">
                    {agent.domain_fr || agent.domain} · {agent.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={agent.status === 'active' ? 'badge-green' : 'badge-gray'}>
                  {agent.status === 'active' ? '● Active' : '○ Offline'}
                </span>
                {agent.on_chain_activity && <span className="badge-purple">on-chain</span>}
                <span className="badge-gray">Conf. {(agent.confidence_avg * 100).toFixed(0)}%</span>
              </div>
            </div>

            {agent.example_markets && agent.example_markets.length > 0 && (
              <div className="mb-3 text-xs text-gray-500">
                Ex. marchés : {agent.example_markets.join(' · ')}
              </div>
            )}

            <div className="space-y-2">
              {agent.forecasts.map((f, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#111118] border border-[#2a2a3a] flex flex-col sm:flex-row sm:items-center gap-2"
                >
                  <div className="min-w-[90px]">
                    <p className="font-semibold text-sm">{f.asset}</p>
                    <p className={`text-xs font-bold ${dirColor(f.direction)}`}>{f.direction}</p>
                  </div>
                  <div className="flex-1 text-xs text-gray-400">{f.rationale}</div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={signalBadge(f.signal)}>{f.signal}</span>
                    <span className="text-xs text-gray-500">{(f.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={agent.gsn_url || 'https://app.greensmoke.network/agents'}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-purple-400 mt-3 inline-block"
            >
              Voir sur GreenSmoke →
            </a>
          </div>
        ))}
      </div>

      <div className="grid gap-4 mb-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="card border-emerald-500/20 bg-emerald-500/5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">
                💸 Répartition des flux
              </p>
              <h2 className="text-xl font-black">Où va l’argent quand un agent est vendu ?</h2>
              <p className="mt-2 text-sm text-gray-400">
                Le smart contract <code className="text-emerald-300">buyAgentAction</code> encaisse le prix total en EGLD,
                paie le vendeur net, puis garde la fee protocole dans la trésorerie du contrat.
              </p>
            </div>
            <span className="badge-green">On-chain source of truth</span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">1. Acheteur</p>
              <p className="mt-2 font-semibold text-white">Paie 100 % du prix affiché</p>
              <p className="mt-2 text-sm text-gray-400">
                Le wallet envoie <code className="text-emerald-300">price</code> en EGLD au contrat agents-marketplace.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">2. Vendeur / issuer</p>
              <p className="mt-2 font-semibold text-white">Reçoit le net vendeur</p>
              <p className="mt-2 text-sm text-gray-400">
                Montant envoyé : <code className="text-emerald-300">price - fee</code>. Il n’y a pas de royalty artiste séparée
                dans le contrat agents actuel.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">3. Trésorerie protocole</p>
              <p className="mt-2 font-semibold text-white">Conserve la fee</p>
              <p className="mt-2 text-sm text-gray-400">
                La <code className="text-emerald-300">marketplace fee</code> reste dans le smart contract jusqu’au retrait
                opérateur. Aucun burn / split LP / staking n’est branché ici aujourd’hui.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-gray-300">
            <p>
              <span className="font-semibold text-white">Formule exacte :</span>{' '}
              <code className="text-emerald-300">seller proceeds = listing price - (listing price × fee_bps / 10 000)</code>
            </p>
            <p className="mt-2 text-gray-400">
              Le stock affiché dans les éditions limitées vient de <code className="text-emerald-300">data/agents_catalog.json</code>;
              ce compteur n’est pas recalculé on-chain par le contrat actuel.
            </p>
          </div>
        </section>

        <section className="card border-cyan-500/20 bg-cyan-500/5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">
              🛠️ Préparation Vellum → rebuild → publication
            </p>
            <h2 className="text-xl font-black">État de synchronisation frontend</h2>
            <p className="mt-2 text-sm text-gray-400">
              Vérifie ici si l’app est prête à être reconstruite et republiée avec les dernières données Vellum.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">Dernière MAJ statut</p>
              <p className="mt-2 font-semibold text-white">
                {liaStatus?.timestamp ? new Date(liaStatus.timestamp).toLocaleString('fr-FR') : 'Non publiée'}
              </p>
              <p className="mt-2 text-xs text-gray-400">{liaStatus?.cycle?.summary || 'Aucun résumé de cycle publié.'}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">Pipeline publié</p>
              <p className="mt-2 font-semibold text-white">{liaStatus?.architecture?.pipeline || 'Pipeline non remonté'}</p>
              <p className="mt-2 text-xs text-gray-400">
                Publish node : {liaStatus?.architecture?.publish || 'non renseigné'}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">Build / déploiement</p>
              <p className="mt-2 text-sm text-white">{liaStatus?.deploy?.frontend_build || 'Statut build indisponible'}</p>
              <p className="mt-2 text-xs text-gray-400">
                Pages : {liaStatus?.deploy?.pages_build_deployment || 'Statut Pages indisponible'}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Agents SC : {liaStatus?.agents_marketplace?.build_status || 'Statut build agents indisponible'}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111118] p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">Adresse agents-marketplace</p>
              <p className="mt-2 break-all font-mono text-sm text-white">{publishedMarketplaceAddress || 'null'}</p>
              <p className="mt-2 text-xs text-gray-400">
                Source attendue : {liaStatus?.agents_marketplace?.address_source || 'data/contracts.json / env'}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
              <span className={publishedMarketplaceReady ? 'text-emerald-400' : 'text-red-400'}>
                {publishedMarketplaceReady ? '●' : '●'}
              </span>
              <div>
                <p className="text-white">Mirrored contract address</p>
                <p className="text-xs text-gray-400">
                  {publishedMarketplaceReady
                    ? 'L’adresse agents_marketplace est publiée dans les fichiers miroir.'
                    : 'Bloquant actuel : contracts.agents_marketplace est encore null côté données publiées.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
              <span className={marketplaceReady ? 'text-emerald-400' : 'text-orange-400'}>●</span>
              <div>
                <p className="text-white">Wallet actions / Warps</p>
                <p className="text-xs text-gray-400">
                  {marketplaceReady
                    ? `Le frontend peut déjà préparer les transactions via ${marketplaceAddress}.`
                    : 'Les boutons achat / listing restent bloqués tant que l’adresse n’est pas injectée dans l’env ou contracts.json.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
              <span className="text-cyan-400">●</span>
              <div>
                <p className="text-white">Rebuild Vellum attendu</p>
                <p className="text-xs text-gray-400">
                  {liaStatus?.agents_marketplace?.frontend_rebuild ||
                    'Relancer update_warps_from_contracts puis publish_data_for_frontend avant le rebuild GitHub Pages.'}
                </p>
              </div>
            </div>
          </div>

          {criticalGaps.length > 0 && (
            <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
              <p className="text-sm font-semibold text-orange-200">Blocages prioritaires Vellum</p>
              <div className="mt-3 space-y-2">
                {criticalGaps.map((gap) => (
                  <div key={gap.id} className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">
                    <p className="text-sm text-white">
                      {gap.id} · {gap.issue}
                    </p>
                    <p className="mt-1 text-xs text-gray-300">{gap.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4 text-xs text-gray-400">
            <p>Consumers frontend : {(vellumMachine?.frontend_consumers?.['/agents'] || []).join(' · ') || 'non publiés'}</p>
            <p className="mt-2">
              Warps attendus : {(liaStatus?.agents_marketplace?.warp_templates || []).join(' · ') || 'non publiés'}
            </p>
          </div>
        </section>
      </div>

      <h2 className="text-lg font-bold mb-3">🤖 Agents opérationnels LIA v6</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {LIA_AGENTS.map(a => (
          <div key={a.key} className="card flex items-center gap-3">
            <span className="text-2xl">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${a.color}`}>{a.name}</p>
              <p className="text-[11px] text-gray-500 truncate">{a.desc}</p>
            </div>
            <span className="badge-green text-[10px]">●</span>
          </div>
        ))}
      </div>

      <div className="card mb-6 border-purple-500/25 bg-purple-500/5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">🛒 Agents Marketplace on-chain</p>
            <p className="text-sm text-gray-300">
              Liste et achète des actions d’agents via <code className="text-purple-300">listAgentAction</code> et <code className="text-purple-300">buyAgentAction</code>.
            </p>
            <p className="text-[11px] text-gray-500 mono mt-2">
              {marketplaceReady ? `SC: ${marketplaceAddress}` : 'SC agents-marketplace non configuré — renseigne VITE_AGENTS_MARKETPLACE_ADDRESS ou data/contracts.json'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://github.com/Neltud/xArtists/blob/main/docs/AGENTS_MARKETPLACE_INTEGRATION.md"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm"
            >
              Doc intégration ↗
            </a>
            <a
              href="https://github.com/JoAiHQ/warps-specs"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm"
            >
              Specs Warps ↗
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#2a2a3a] bg-[#111118] p-4 space-y-3">
            <p className="font-semibold text-sm text-purple-200">Lister une action agent</p>
            <div className="flex flex-wrap gap-2">
              <label className="flex flex-col gap-1 flex-1 min-w-[220px]">
                <span className="text-[10px] uppercase text-gray-500">Agent ID</span>
                <input
                  type="text"
                  value={listAgentId}
                  onChange={(e) => setListAgentId(e.target.value)}
                  className="rounded-lg border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="flex flex-col gap-1 w-36">
                <span className="text-[10px] uppercase text-gray-500">Prix EGLD</span>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  className="rounded-lg border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-white"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={marketplacePending || !marketplaceReady}
                onClick={onListAgent}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {marketplacePending ? '…' : 'List agent'}
              </button>
              <WarpButton warp={listWarp} filename="list-agent-action.json" disabled={!marketplaceReady} />
            </div>
          </div>

          <div className="rounded-xl border border-[#2a2a3a] bg-[#111118] p-4 space-y-3">
            <p className="font-semibold text-sm text-purple-200">Acheter une action agent</p>
            <div className="flex flex-wrap gap-2">
              <label className="flex flex-col gap-1 w-32">
                <span className="text-[10px] uppercase text-gray-500">Listing ID</span>
                <input
                  type="number"
                  min="1"
                  value={buyListingId}
                  onChange={(e) => setBuyListingId(e.target.value)}
                  className="rounded-lg border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="flex flex-col gap-1 w-36">
                <span className="text-[10px] uppercase text-gray-500">Paiement EGLD</span>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="rounded-lg border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-white"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={marketplacePending || !marketplaceReady}
                onClick={onBuyAgent}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {marketplacePending ? '…' : 'Buy agent'}
              </button>
              <WarpButton warp={buyWarp} filename="buy-agent-action.json" disabled={!marketplaceReady} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 text-xs">
          <a href={`${import.meta.env.BASE_URL}data/warps/buy-agent-action.json`} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">
            Template Warp buy ↗
          </a>
          <a href={`${import.meta.env.BASE_URL}data/warps/list-agent-action.json`} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">
            Template Warp list ↗
          </a>
          <a href={`${import.meta.env.BASE_URL}data/warps/get-listing.json`} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">
            Template Warp getListing ↗
          </a>
        </div>

        {(marketplaceMsg || marketplaceError || marketplaceLastTx) && (
          <p className="text-[11px] text-amber-200/90 mt-3">
            {marketplaceMsg || marketplaceError}
            {marketplaceLastTx ? ` · tx ${marketplaceLastTx}` : ''}
          </p>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Données : <code className="text-purple-400">data/greensmoke_forecasts.json</code> · Protocol GSN live depuis juin 2026
      </p>
    </div>
  )
}
