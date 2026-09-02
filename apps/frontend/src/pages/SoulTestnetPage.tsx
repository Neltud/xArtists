import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SOUL, SOUL_ACTIONS, SOUL_POLICY, type SoulActionId } from '../config/soul'
import { LINKS } from '../config/links'
import PreMainnetBanner from '../components/PreMainnetBanner'
import { PRE_MAINNET_MODULES } from '../config/preMainnet'
import LiaVsUserBanner from '../components/LiaVsUserBanner'

const mod = PRE_MAINNET_MODULES.find(m => m.id === 'soul')

type SimMode = 'supply_only' | 'collateral' | 'borrow_blocked' | 'defense'

/** Paper HF toy model — education only, not on-chain */
function paperHf(collateralUsd: number, borrowUsd: number, liqThreshold = 0.85): number {
  if (borrowUsd <= 0) return 999
  return (collateralUsd * liqThreshold) / borrowUsd
}

function liaDecision(opts: {
  defense: boolean
  amountUsd: number
  wantBorrow: boolean
  wantCrossChain: boolean
}): { action: SoulActionId; ok: boolean; reason: string; amountUsd: number } {
  if (opts.defense) {
    return {
      action: 'skip',
      ok: false,
      reason: 'DEFENSE / RISK_OFF — aucun nouveau risque Soul',
      amountUsd: 0,
    }
  }
  if (opts.wantCrossChain) {
    return {
      action: 'soul_cross_chain_lend',
      ok: false,
      reason: 'Cross-chain lend bloqué v1 (bridge + audit)',
      amountUsd: opts.amountUsd,
    }
  }
  if (opts.amountUsd < SOUL_POLICY.minAmountUsd) {
    return {
      action: 'skip',
      ok: false,
      reason: `Montant < ${SOUL_POLICY.minAmountUsd} USD`,
      amountUsd: opts.amountUsd,
    }
  }
  if (opts.wantBorrow) {
    return {
      action: 'skip',
      ok: false,
      reason: 'Borrow Soul interdit en v1 (max_leverage_loops=0, experimental)',
      amountUsd: opts.amountUsd,
    }
  }
  const supply = opts.amountUsd * SOUL_POLICY.autoSupplyFraction
  return {
    action: 'soul_supply',
    ok: true,
    reason: `Paper intent SUPPLY ${supply.toFixed(2)} USD (50 % sleeve, HF min ${SOUL_POLICY.minHfOpen})`,
    amountUsd: supply,
  }
}

export default function SoulTestnetPage() {
  const [mode, setMode] = useState<SimMode>('supply_only')
  const [sleeveUsd, setSleeveUsd] = useState(100)
  const [collat, setCollat] = useState(1000)
  const [debt, setDebt] = useState(0)

  const defense = mode === 'defense'
  const decision = useMemo(
    () =>
      liaDecision({
        defense,
        amountUsd: sleeveUsd,
        wantBorrow: mode === 'borrow_blocked',
        wantCrossChain: false,
      }),
    [defense, sleeveUsd, mode]
  )

  const hf = paperHf(collat, debt)
  const gatesDone = SOUL.mainnetGates.filter(g => g.done).length

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-24 md:pb-8">
      <PreMainnetBanner module={mod} />
      <LiaVsUserBanner tone="protocol" />

      <header>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Soul Protocol</h1>
        <p className="text-zinc-400 text-sm mt-2">
          Couche liquidité <strong className="text-amber-200">cross-chain</strong> (Aave / Compound /
          Venus…) — statut <span className="text-amber-300 font-medium">{SOUL.status}</span>. Settlement
          xArtists = <strong className="text-purple-300">MultiversX</strong>
          {SOUL.mxNative ? ' + marchés Soul natifs' : ' (pas de marché Soul natif MVX aujourd’hui)'}.
        </p>
        <p className="text-zinc-500 text-xs mt-2">{SOUL.disclaimer}</p>
        <p className="text-[11px] text-red-300/90 mt-2 font-medium">
          Aucune TX user · aucun dépôt Connect sur Soul experimental · Hatom = lending MVX de prod.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-1">
          Processus lend / borrow
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Ordre conceptuel Controller / sToken. UI = éducation + paper LIA.
        </p>
        <ol className="space-y-3">
          {SOUL_ACTIONS.map(a => (
            <li
              key={a.id}
              className={`rounded-lg border px-3 py-2.5 text-sm ${
                a.risk === 'blocked'
                  ? 'border-red-500/30 bg-red-950/20'
                  : a.liaPaper
                    ? 'border-teal-500/25 bg-teal-950/10'
                    : 'border-zinc-700 bg-zinc-950/40'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <span className="font-semibold text-zinc-100">
                  {a.step}. {a.label}
                </span>
                <span className="flex gap-1 text-[10px]">
                  {a.liaPaper ? (
                    <span className="rounded-full bg-teal-500/20 text-teal-300 px-2 py-0.5">
                      LIA paper OK
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-700 text-zinc-400 px-2 py-0.5">
                      LIA paper skip
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      a.risk === 'blocked'
                        ? 'bg-red-500/20 text-red-300'
                        : a.risk === 'high'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    {a.risk}
                  </span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{a.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-purple-500/25 bg-purple-950/20 p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-300 mb-2">
          Comment LIA décide (SoulRouter)
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          <code className="text-[10px]">lia/defi/soul_routes.py</code> · paper only
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <label className="text-xs text-zinc-400">
            Sleeve yield dispo (USD paper)
            <input
              type="number"
              min={0}
              value={sleeveUsd}
              onChange={e => setSleeveUsd(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
            />
          </label>
          <div className="text-xs text-zinc-400">
            Scénario
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(
                [
                  ['supply_only', 'Supply only'],
                  ['collateral', '+ Collateral'],
                  ['borrow_blocked', 'Want borrow'],
                  ['defense', 'DEFENSE'],
                ] as const
              ).map(([k, lab]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMode(k)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${
                    mode === k
                      ? 'border-purple-500 bg-purple-500/20 text-purple-100'
                      : 'border-zinc-700 text-zinc-400'
                  }`}
                >
                  {lab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg border px-3 py-3 text-sm ${
            decision.ok ? 'border-teal-500/40 bg-teal-950/30' : 'border-amber-500/40 bg-amber-950/20'
          }`}
        >
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Décision auto_route</p>
          <p className="font-mono text-purple-200">{decision.action}</p>
          <p className="text-xs text-zinc-300 mt-1">{decision.reason}</p>
          {decision.ok && (
            <p className="text-xs text-teal-300 mt-1">
              amount_usd ≈ {decision.amountUsd.toFixed(2)} · paper=true
            </p>
          )}
        </div>

        <ul className="mt-4 text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
          <li>
            <strong className="text-zinc-200">Priorité</strong> : Hatom (MVX) avant Soul
          </li>
          <li>
            <strong className="text-zinc-200">auto_route</strong> : SUPPLY seulement · 0 leverage loop
          </li>
          <li>
            <strong className="text-zinc-200">DEFENSE</strong> → SKIP (Guardian)
          </li>
          <li>
            Wallet <strong>LIA ops</strong> seulement pour futurs intents — jamais Connect user
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Simulateur HF (pédagogique)
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="text-xs text-zinc-400">
            Collateral USD
            <input
              type="number"
              value={collat}
              onChange={e => setCollat(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-400">
            Debt USD
            <input
              type="number"
              value={debt}
              onChange={e => setDebt(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="text-lg font-bold">
          HF paper{' '}
          <span className={hf >= 2 ? 'text-green-400' : hf >= 1.5 ? 'text-amber-400' : 'text-red-400'}>
            {hf >= 999 ? 'N/A (no debt)' : hf.toFixed(2)}
          </span>
        </p>
      </section>

      <section className="rounded-xl border border-zinc-800 p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Anticipation mainnet ({gatesDone}/{SOUL.mainnetGates.length} gates)
        </h2>
        <ul className="space-y-2">
          {SOUL.mainnetGates.map(g => (
            <li key={g.id} className="flex gap-2 text-xs text-zinc-300">
              <span>{g.done ? '✅' : '⬜'}</span>
              <span>{g.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <Link
          to="/hatom"
          className="inline-flex justify-center rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-medium"
        >
          Lending live → Hatom (MVX)
        </Link>
        <a
          href={SOUL.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          docs.soul.io ↗
        </a>
        <a
          href={LINKS.explorer}
          target="_blank"
          rel="noreferrer"
          className="inline-flex justify-center rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Explorer MultiversX
        </a>
      </div>
    </div>
  )
}
