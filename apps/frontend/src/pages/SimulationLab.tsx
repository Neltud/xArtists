/**
 * Simulation Lab — exhaustive client-side demo of LIA trades, user journey, modules.
 * SC deploy soon: UI already models every path; on-chain gates stay fail-closed.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'

type SimTrade = {
  id: string
  ts: number
  echelon: number
  pair: string
  side: 'BUY' | 'SELL'
  sizeUsd: number
  entry: number
  exit: number
  feeUsd: number
  gasUsd: number
  pnlNet: number
  strategy: string
  stopLoss: number
}

const PAIRS = ['TRO/USDC', 'WEGLD/USDC', 'MEX/WEGLD', 'UTK/WEGLD', 'TRO/WEGLD']
const STRATS = ['S1-1pct', 'S05-scalp', 'S2-swing', 'GSN-elite', 'ARB-xEx']

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function genTrades(n: number, seed = 42): SimTrade[] {
  const r = rng(seed)
  const out: SimTrade[] = []
  let t = Date.now() - n * 45_000
  for (let i = 0; i < n; i++) {
    const pair = PAIRS[Math.floor(r() * PAIRS.length)]
    const side: 'BUY' | 'SELL' = r() > 0.45 ? 'BUY' : 'SELL'
    const sizeUsd = 8 + r() * 40
    const entry = pair.startsWith('TRO') ? 0.00001 + r() * 0.00002 : 10 + r() * 30
    const edge = (r() - 0.42) * 0.025
    const exit = entry * (1 + (side === 'BUY' ? edge : -edge))
    const feeUsd = sizeUsd * 0.003
    const gasUsd = 0.02 + r() * 0.08
    const gross = sizeUsd * edge
    const pnlNet = gross - feeUsd - gasUsd
    const stopLoss = entry * (side === 'BUY' ? 0.995 : 1.005)
    out.push({
      id: `sim-${seed}-${i}`,
      ts: t,
      echelon: (i % 10) + 1,
      pair,
      side,
      sizeUsd: Math.round(sizeUsd * 100) / 100,
      entry,
      exit,
      feeUsd: Math.round(feeUsd * 1000) / 1000,
      gasUsd: Math.round(gasUsd * 1000) / 1000,
      pnlNet: Math.round(pnlNet * 100) / 100,
      strategy: STRATS[Math.floor(r() * STRATS.length)],
      stopLoss,
    })
    t += 30_000 + Math.floor(r() * 60_000)
  }
  return out.reverse()
}

const JOURNEY = [
  {
    id: 'connect',
    title: '1. Connecter le wallet',
    body: 'Web Wallet / xPortal / extension — ou lecture seule erd1. Jamais le wallet LIA ops.',
    route: '/wallet',
    sim: 'Modal Connect · paste_readonly = pas de signature',
  },
  {
    id: 'packs',
    title: '2. Explorer les packs Agents',
    body: 'Series A/B/C limités · prix TRO/USDC/EGLD · Model C access pass (pas un fonds).',
    route: '/agents',
    sim: 'Catalogue + checkout UI · buy on-chain après deploy SC',
  },
  {
    id: 'mypacks',
    title: '3. My Packs',
    body: 'Voir ses access · perf paper affichée · capital agent escrow (Soon).',
    route: '/my-packs',
    sim: 'Liste locale / mock NFT tant que SC null',
  },
  {
    id: 'trading',
    title: '4. Terminal LIA',
    body: 'Board paper · fusion GSN · brain EV · legs · compounding 10 col.',
    route: '/trading',
    sim: 'Cette page Lab génère aussi des trades simulés live',
  },
  {
    id: 'market',
    title: '5. Marketplace NFT',
    body: 'Galerie + list/buy — bannières SC pending jusqu’au codeHash.',
    route: '/marketplace',
    sim: 'Simulation list/buy ci-dessous sans envoyer de TX',
  },
  {
    id: 'studio',
    title: '6. Studio artiste',
    body: 'Collection → IPFS → metadata → mint (EGLD gaz).',
    route: '/studio',
    sim: 'Wizard 4 étapes · pin via proxy ops',
  },
  {
    id: 'tip',
    title: '7. Tip (optionnel)',
    body: 'Don volontaire vers LIA ops — pas un investissement.',
    route: '/tip',
    sim: 'Vraie TX possible si wallet signant',
  },
] as const

type ModuleSim = {
  id: string
  title: string
  status: 'live-read' | 'paper' | 'sc-soon' | 'shell'
  detail: string[]
  route: string
}

const MODULES: ModuleSim[] = [
  {
    id: 'lia-board',
    title: 'LIA Board & Commander',
    status: 'paper',
    detail: [
      'Guardian ARMED/TRIPPED',
      'Risk Manager dd ≤ 15%',
      'Desk + mode YIELD/DEFENSE',
      'Kill = ops reset only',
    ],
    route: '/',
  },
  {
    id: 'trading',
    title: 'Trading terminal',
    status: 'paper',
    detail: [
      'Fusion GSN≥80% · Polymarket · free',
      'Brain Monte-Carlo EV',
      'DecisionProof PaperOnly',
      'Paper legs gate→proof',
      'Compounding 10 colonnes 1%',
    ],
    route: '/trading',
  },
  {
    id: 'compound',
    title: 'Compounding 10 echelons',
    status: 'paper',
    detail: [
      '10 portefeuilles isolés',
      'Trades distincts / colonne',
      'Fees + gas déduits',
      'Pertes possibles · variance UI',
      'Cible sink 1M USDC LIA',
    ],
    route: '/trading',
  },
  {
    id: 'agents',
    title: 'Agents packs NFT',
    status: 'sc-soon',
    detail: [
      '3 séries limitées',
      'Pay TRO / USDC / EGLD (UI)',
      'Mint = NFT agent',
      'Buy on-chain après agents SC',
      'Royalties secondary planifiées',
    ],
    route: '/agents',
  },
  {
    id: 'market',
    title: 'Marketplace NFT / RWA',
    status: 'sc-soon',
    detail: [
      'List / Buy / Bid gated codeHash',
      '1 TRO max œuvre physique policy',
      'Index listings post-deploy',
      'Pas de faux orderbook live',
    ],
    route: '/marketplace',
  },
  {
    id: 'studio',
    title: 'Artist Studio',
    status: 'live-read',
    detail: [
      'Wizard collection → pin → mint',
      'JWT Pinata hors front',
      'Mint réel = wallet + EGLD',
    ],
    route: '/studio',
  },
  {
    id: 'wallet',
    title: 'User wallet',
    status: 'live-read',
    detail: ['Soldes API MVX', 'NFT owned', '≠ LIA ops wallet'],
    route: '/wallet',
  },
  {
    id: 'tro',
    title: '$TRO utility',
    status: 'live-read',
    detail: ['Cap 500k', 'Swap xExchange links', 'DAO read-first'],
    route: '/tro',
  },
  {
    id: 'staking',
    title: 'Staking / pools',
    status: 'sc-soon',
    detail: ['UI pools xExchange/OneDex', 'Stake TRO bouton', 'Rewards SC soon'],
    route: '/staking',
  },
  {
    id: 'tip',
    title: 'Tips / treasury',
    status: 'live-read',
    detail: ['Tip EGLD memo', 'Split 40/30/20/10 policy', 'Splitter SC soon'],
    route: '/tip',
  },
  {
    id: 'risk',
    title: 'Risk Manager',
    status: 'paper',
    detail: ['Lock si dd > 15%', 'SYSTEM_LOCKDOWN', 'Unlock manuel ops'],
    route: '/',
  },
  {
    id: 'rwa',
    title: 'RWA / escrow',
    status: 'shell',
    detail: ['Validator off-chain', 'SC after market', 'Supernova timing aware'],
    route: '/marketplace',
  },
]

function statusBadge(s: ModuleSim['status']) {
  const map = {
    'live-read': 'bg-green-500/15 text-green-300 border-green-500/30',
    paper: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    'sc-soon': 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    shell: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  }
  const label = {
    'live-read': 'LIVE READ',
    paper: 'PAPER SIM',
    'sc-soon': 'SC SOON',
    shell: 'SHELL',
  }
  return (
    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[s]}`}>
      {label[s]}
    </span>
  )
}

export default function SimulationLab() {
  const [tab, setTab] = useState<'trades' | 'journey' | 'modules' | 'market-sim'>('trades')
  const [running, setRunning] = useState(true)
  const [seed, setSeed] = useState(42)
  const [trades, setTrades] = useState<SimTrade[]>(() => genTrades(24, 42))
  const [journeyStep, setJourneyStep] = useState(0)
  const [listSim, setListSim] = useState<{ title: string; price: number; status: string } | null>(
    null
  )
  const [buySim, setBuySim] = useState<string | null>(null)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setTrades(prev => {
        const batch = genTrades(1, Date.now() % 100000)
        return [...batch, ...prev].slice(0, 40)
      })
    }, 4000)
    return () => clearInterval(id)
  }, [running])

  const stats = useMemo(() => {
    const wins = trades.filter(t => t.pnlNet > 0).length
    const pnl = trades.reduce((a, t) => a + t.pnlNet, 0)
    const fees = trades.reduce((a, t) => a + t.feeUsd + t.gasUsd, 0)
    return {
      n: trades.length,
      wins,
      winRate: trades.length ? (wins / trades.length) * 100 : 0,
      pnl: Math.round(pnl * 100) / 100,
      fees: Math.round(fees * 100) / 100,
    }
  }, [trades])

  const reshuffle = useCallback(() => {
    const s = seed + 1
    setSeed(s)
    setTrades(genTrades(24, s))
  }, [seed])

  return (
    <div className="animate-fade-in pb-10">
      <PageGuide page="dashboard" />
      <div className="mb-6">
        <h1 className="text-3xl font-black">🧪 Simulation Lab</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Trades LIA simulés · parcours utilisateur · chaque module en détail · SC deploy soon
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ['trades', 'Trades LIA'],
            ['journey', 'Parcours user'],
            ['modules', 'Modules'],
            ['market-sim', 'Market / Agents sim'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              tab === id
                ? 'border-purple-500 bg-purple-600/25 text-purple-200'
                : 'border-[#2a2a3a] text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'trades' && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Trades" v={String(stats.n)} />
            <Stat label="Win rate" v={`${stats.winRate.toFixed(0)}%`} />
            <Stat label="PnL net" v={`$${stats.pnl}`} accent={stats.pnl >= 0} />
            <Stat label="Fees+gas" v={`$${stats.fees}`} />
            <div className="card flex flex-col justify-center gap-2">
              <button type="button" className="btn-primary text-xs py-1.5" onClick={() => setRunning(r => !r)}>
                {running ? 'Pause stream' : 'Resume stream'}
              </button>
              <button type="button" className="btn-secondary text-xs py-1.5" onClick={reshuffle}>
                Reseed
              </button>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            Simulation locale navigateur — fees 0.3% + gas aléatoire · stop implicite 0.5% · 10
            echelons · <strong className="text-zinc-400">pas une promesse de perf</strong> · LIA live
            off.
          </p>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-[10px] uppercase text-zinc-500 border-b border-[#2a2a3a]">
                  <th className="text-left py-2">Col</th>
                  <th className="text-left py-2">Pair</th>
                  <th className="text-left py-2">Strat</th>
                  <th className="text-left py-2">Side</th>
                  <th className="text-right py-2">Size</th>
                  <th className="text-right py-2">Fee</th>
                  <th className="text-right py-2">PnL</th>
                  <th className="text-right py-2">SL</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id + t.ts} className="border-b border-[#2a2a3a]/40">
                    <td className="py-1.5 text-xs">E{t.echelon}</td>
                    <td className="py-1.5">{t.pair}</td>
                    <td className="py-1.5 text-xs text-purple-300">{t.strategy}</td>
                    <td className="py-1.5">{t.side}</td>
                    <td className="py-1.5 text-right mono">{t.sizeUsd}</td>
                    <td className="py-1.5 text-right mono text-zinc-500">{t.feeUsd}</td>
                    <td
                      className={`py-1.5 text-right mono ${
                        t.pnlNet >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {t.pnlNet}
                    </td>
                    <td className="py-1.5 text-right mono text-[10px] text-zinc-500">
                      {t.stopLoss.toPrecision(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/trading" className="text-sm text-teal-300 hover:underline">
            Ouvrir le terminal paper réel (JSON Vellum) →
          </Link>
        </section>
      )}

      {tab === 'journey' && (
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            {JOURNEY.map((j, i) => (
              <button
                key={j.id}
                type="button"
                onClick={() => setJourneyStep(i)}
                className={`w-full text-left rounded-xl border p-3 transition-colors ${
                  journeyStep === i
                    ? 'border-purple-500/50 bg-purple-600/15'
                    : 'border-[#2a2a3a] bg-[#0d0d14] hover:border-white/10'
                }`}
              >
                <p className="font-semibold text-sm">{j.title}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{j.body}</p>
              </button>
            ))}
          </div>
          <div className="card border-purple-500/25 sticky top-20 h-fit">
            <p className="text-[10px] uppercase text-zinc-500">Étape active</p>
            <h2 className="text-xl font-bold mt-1">{JOURNEY[journeyStep].title}</h2>
            <p className="text-sm text-zinc-300 mt-2">{JOURNEY[journeyStep].body}</p>
            <p className="text-xs text-cyan-200/90 mt-3 rounded-lg bg-black/30 p-2 border border-white/5">
              Sim : {JOURNEY[journeyStep].sim}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link to={JOURNEY[journeyStep].route} className="btn-primary text-sm">
                Aller à la page →
              </Link>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => setJourneyStep(s => Math.min(JOURNEY.length - 1, s + 1))}
              >
                Étape suivante
              </button>
            </div>
            <div className="mt-4 flex gap-1">
              {JOURNEY.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i <= journeyStep ? 'bg-purple-500' : 'bg-zinc-700'}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'modules' && (
        <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {MODULES.map(m => (
            <div key={m.id} className="card border-[#2a2a3a] flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-sm">{m.title}</h3>
                {statusBadge(m.status)}
              </div>
              <ul className="text-[11px] text-zinc-400 space-y-1 flex-1 mb-3">
                {m.detail.map(d => (
                  <li key={d} className="flex gap-1.5">
                    <span className="text-purple-400">·</span> {d}
                  </li>
                ))}
              </ul>
              <Link to={m.route} className="text-xs text-purple-300 hover:underline">
                Ouvrir →
              </Link>
            </div>
          ))}
        </section>
      )}

      {tab === 'market-sim' && (
        <section className="grid md:grid-cols-2 gap-6">
          <div className="card border-amber-500/25">
            <h2 className="font-bold mb-1">Simuler List NFT</h2>
            <p className="text-[11px] text-amber-200/80 mb-3">
              Aucune TX — preview UX. Après deploy : même flux + signature wallet.
            </p>
            <input
              className="w-full mb-2 p-2 rounded-lg bg-[#111118] border border-[#2a2a3a] text-sm"
              placeholder="Titre œuvre"
              id="sim-title"
              defaultValue="xArtists Demo #1"
            />
            <input
              className="w-full mb-3 p-2 rounded-lg bg-[#111118] border border-[#2a2a3a] text-sm"
              type="number"
              placeholder="Prix EGLD"
              id="sim-price"
              defaultValue={1.5}
              step={0.1}
            />
            <button
              type="button"
              className="btn-primary text-sm w-full"
              onClick={() => {
                const title =
                  (document.getElementById('sim-title') as HTMLInputElement)?.value || 'Untitled'
                const price = Number(
                  (document.getElementById('sim-price') as HTMLInputElement)?.value || 0
                )
                setListSim({ title, price, status: 'SIMULATED_LIST — awaiting SC codeHash' })
              }}
            >
              Simuler List
            </button>
            {listSim && (
              <div className="mt-3 rounded-lg border border-white/10 bg-black/40 p-3 text-xs">
                <p className="font-semibold">{listSim.title}</p>
                <p className="text-zinc-400">{listSim.price} EGLD</p>
                <p className="text-amber-300 mt-1">{listSim.status}</p>
              </div>
            )}
          </div>

          <div className="card border-amber-500/25">
            <h2 className="font-bold mb-1">Simuler Buy Agent pack</h2>
            <p className="text-[11px] text-amber-200/80 mb-3">
              Series A · 50 TRO mock · SC agents bientôt.
            </p>
            <div className="rounded-lg border border-[#2a2a3a] p-3 mb-3 text-sm">
              <p className="font-semibold">Pack Series A — Oracle Sentinel</p>
              <p className="text-xs text-zinc-500">Supply limitée · access Model C</p>
              <p className="mono text-purple-300 mt-1">50 TRO · ou USDC/EGLD</p>
            </div>
            <button
              type="button"
              className="btn-primary text-sm w-full"
              onClick={() =>
                setBuySim(
                  'SIMULATED_BUY — NFT agent serait minté après agents_marketplace deploy + verify'
                )
              }
            >
              Simuler Buy pack
            </button>
            {buySim && (
              <p className="mt-3 text-xs text-amber-200 border border-amber-500/20 rounded-lg p-2">
                {buySim}
              </p>
            )}
            <Link to="/agents" className="inline-block mt-3 text-xs text-purple-300 hover:underline">
              Catalogue Agents →
            </Link>
          </div>

          <div className="md:col-span-2 card border-cyan-500/20 text-xs text-zinc-400">
            <p className="font-semibold text-cyan-200 mb-1">Contrats bientôt</p>
            Quand codeHash OK : mêmes boutons appelleront sdk-dapp (BigInt amounts) · flags{' '}
            <code className="text-[10px]">VITE_*_CODEHASH_OK=1</code> · micro List/Buy user wallet
            only. Voir <code className="text-[10px]">docs/SC_DEPLOY_COMMANDS.md</code>.
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({
  label,
  v,
  accent,
}: {
  label: string
  v: string
  accent?: boolean
}) {
  return (
    <div className="card">
      <p className="text-[10px] uppercase text-zinc-500">{label}</p>
      <p
        className={`text-lg font-bold mono mt-1 ${
          accent === undefined ? '' : accent ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {v}
      </p>
    </div>
  )
}
