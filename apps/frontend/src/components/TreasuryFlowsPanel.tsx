/**
 * Lecture seule — matrice de répartition trésorerie (paper model).
 */
import {
  TREASURY_FLOW_MATRIX,
  BURN_POLICY,
  HOLDERS_REWARD_ELIGIBILITY,
  type RevenueSource,
} from '../config/treasuryFlows'
import { Link } from 'react-router-dom'

const SOURCE_LABELS: Record<RevenueSource, string> = {
  pack_paper: 'Packs paper',
  ads_bid: 'Enchères ads',
  venue_rental: 'Location salles',
  marketplace_sale: 'Marketplace',
  slot_casino: 'Slot (rake)',
  tip: 'Tips LIA',
  lp_fees_external: 'LP fees externes',
}

const BUCKET_LABELS: Record<string, string> = {
  lia_treasury: 'LIA',
  institution: 'Institution',
  associations: 'Assoc.',
  holders_rewards: 'Holders',
  burn_tro: 'Burn TRO',
  creator_royalty: 'Créateur',
  protocol_fee: 'Protocol',
}

export default function TreasuryFlowsPanel() {
  const sources = Object.keys(TREASURY_FLOW_MATRIX) as RevenueSource[]

  return (
    <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-zinc-950 to-amber-950/15 p-4 space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
          Trésorerie · modèle
        </p>
        <h2 className="text-lg font-semibold text-white mt-0.5">Flux de répartition</h2>
        <p className="text-[12px] text-zinc-500 mt-1">
          Lecture seule · paper jusqu’au SC. Pas une promesse de yield. Supply TRO max{" "}
          {BURN_POLICY.maxSupply.toLocaleString('fr-FR')}.
        </p>
      </div>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-left text-[11px] min-w-[320px]">
          <thead>
            <tr className="text-zinc-500 border-b border-white/10">
              <th className="py-1.5 pr-2 font-medium">Source</th>
              <th className="py-1.5 px-1 font-medium">Buckets %</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(src => {
              const row = TREASURY_FLOW_MATRIX[src]
              const parts = Object.entries(row)
                .filter(([, v]) => (v || 0) > 0)
                .map(([k, v]) => `${BUCKET_LABELS[k] || k} ${v}%`)
              return (
                <tr key={src} className="border-b border-white/5">
                  <td className="py-2 pr-2 text-zinc-200 whitespace-nowrap">
                    {SOURCE_LABELS[src]}
                  </td>
                  <td className="py-2 px-1 text-zinc-500">{parts.join(' · ') || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-zinc-500 uppercase tracking-wider text-[10px]">Burn policy</p>
          <p className="text-zinc-300 mt-0.5">
            Préféré: <span className="text-white">{BURN_POLICY.preferred}</span>
          </p>
          <p className="text-zinc-500 mt-0.5">
            LP burn:{" "}
            <span className={BURN_POLICY.lpBurn.enabled ? 'text-amber-300' : 'text-emerald-400/90'}>
              {BURN_POLICY.lpBurn.enabled ? 'ON' : 'OFF'}
            </span>{" "}
            (DAO requis)
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-zinc-500 uppercase tracking-wider text-[10px]">Holders éligibles</p>
          <p className="text-zinc-400 mt-0.5 line-clamp-2">
            {HOLDERS_REWARD_ELIGIBILITY.troLpPools.slice(0, 4).join(', ')}…
          </p>
          <p className="text-zinc-600 mt-0.5">+ ArtPass staked · paper ≠ auth on-chain</p>
        </div>
      </div>

      <p className="text-[11px] text-zinc-600">
        <Link to="/venues" className="text-amber-200/90 hover:underline">
          Location salles
        </Link>
        {' · '}
        <Link to="/docs" className="text-zinc-500 hover:underline">
          docs/TREASURY_FLOWS.md
        </Link>
        {' · '}
        <Link to="/go-live" className="text-zinc-500 hover:underline">
          GO_LIVE
        </Link>
      </p>
    </section>
  )
}
