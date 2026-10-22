import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
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
          {xaRender("Trésorerie · modèle ")}</p>
        <h2 className="text-lg font-semibold text-white mt-0.5">{xaRender("Flux de répartition")}</h2>
        <p className="text-[12px] text-zinc-500 mt-1">
          {xaRender("Lecture seule · paper jusqu’au SC. Pas une promesse de yield. Supply TRO max")}{xaRender(" ")}
          {xaRender(BURN_POLICY.maxSupply.toLocaleString('fr-FR'))}.
        </p>
      </div>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-left text-[11px] min-w-[320px]">
          <thead>
            <tr className="text-zinc-500 border-b border-white/10">
              <th className="py-1.5 pr-2 font-medium">{xaRender("Source")}</th>
              <th className="py-1.5 px-1 font-medium">{xaRender("Buckets %")}</th>
            </tr>
          </thead>
          <tbody>
            {xaRender(sources.map(src => {
              const row = TREASURY_FLOW_MATRIX[src]
              const parts = Object.entries(row)
                .filter(([, v]) => (v || 0) > 0)
                .map(([k, v]) => `${BUCKET_LABELS[k] || k} ${v}%`)
              return (
                <tr key={src} className="border-b border-white/5">
                  <td className="py-2 pr-2 text-zinc-200 whitespace-nowrap">
                    {xaRender(SOURCE_LABELS[src])}
                  </td>
                  <td className="py-2 px-1 text-zinc-500">{xaRender(parts.join(' · ') || '—')}</td>
                </tr>
              )
            }))}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-zinc-500 uppercase tracking-wider text-[10px]">{xaRender("Burn policy")}</p>
          <p className="text-zinc-300 mt-0.5">
            {xaRender("Préféré: ")}<span className="text-white">{xaRender(BURN_POLICY.preferred)}</span>
          </p>
          <p className="text-zinc-500 mt-0.5">
            {xaRender("LP burn:")}{xaRender(" ")}
            <span className={BURN_POLICY.lpBurn.enabled ? 'text-amber-300' : 'text-emerald-400/90'}>
              {xaRender(BURN_POLICY.lpBurn.enabled ? 'ON' : 'OFF')}
            </span>{xaRender(" ")}
            {xaRender("(DAO requis) ")}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-zinc-500 uppercase tracking-wider text-[10px]">{xaRender("Holders éligibles")}</p>
          <p className="text-zinc-400 mt-0.5 line-clamp-2">
            {xaRender(HOLDERS_REWARD_ELIGIBILITY.troLpPools.slice(0, 4).join(', '))}…
          </p>
          <p className="text-zinc-600 mt-0.5">{xaRender("+ ArtPass staked · paper ≠ auth on-chain")}</p>
        </div>
      </div>

      <p className="text-[11px] text-zinc-600">
        <Link to="/venues" className="text-amber-200/90 hover:underline">
          {xaRender("Location salles ")}</Link>
        {xaRender(' · ')}
        <a
          href="https://github.com/Neltud/xArtists/blob/main/docs/TREASURY_FLOWS.md"
          className="text-zinc-500 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {xaRender("docs/TREASURY_FLOWS.md ")}</a>
        {xaRender(' · ')}
        <Link to="/go-live" className="text-zinc-500 hover:underline">
          {xaRender("GO_LIVE ")}</Link>
      </p>
    </section>
  )
}
