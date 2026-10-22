import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Visual breakdown of pack sale → artists / protocol / treasury / pools.
 */
import { useMemo, useState } from 'react'
import {
  PACK_SALE_SPLIT,
  formatBps,
  projectSale,
  assertSplitSum,
} from '../config/revenueSplitter'
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'

type Props = {
  packId?: PackId | null
  className?: string
}

export default function RevenueSplitterPanel({ packId = null, className = '' }: Props) {
  const pack = packId ? AGENT_PACKS.find(p => p.id === packId) : null
  const list = pack?.priceEgld.list ?? 25
  const [egld, setEgld] = useState(list)
  const proj = useMemo(() => projectSale(egld, packId || undefined), [egld, packId])

  return (
    <div className={`rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
          {xaRender("Revenue splitter ")}</p>
        <span className="text-[10px] text-zinc-600">
          Σ {xaRender(assertSplitSum())} {xaRender(" bps · ")}{xaRender(proj.splitter.label)}
        </span>
      </div>

      <label className="block text-[11px] text-zinc-500">
        {xaRender("Prix simulé (EGLD) ")}<input
          type="number"
          min={10}
          step={0.5}
          value={egld}
          onChange={e => setEgld(Math.max(0, Number(e.target.value) || 0))}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
        />
      </label>

      <ul className="space-y-2">
        {xaRender(proj.legs.map(l => (
          <li key={l.id} className="flex items-center gap-2 text-[12px]">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2">
                <span className="text-zinc-300">{xaRender(l.label)}</span>
                <span className="tabular-nums text-white">
                  {xaRender(l.amount.toFixed(3))} · {xaRender(formatBps(l.bps))}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500/80 to-cyan-400/70"
                  style={{ width: `${Math.min(100, l.bps / 100)}%` }}
                />
              </div>
              {xaRender(l.note && <p className="text-[10px] text-zinc-600 mt-0.5">{xaRender(l.note)}</p>)}
            </div>
          </li>
        )))}
      </ul>

      {xaRender(pack && (
        <p className="text-[11px] text-zinc-500">
          {xaRender("Part pool ")}{xaRender(pack.name)} : {xaRender(formatBps(pack.shareOfPackPoolBps))} {xaRender(" du bucket « Pack signal pool ». ")}</p>
      ))}

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        {xaRender("Paper = comptabilité locale. On-chain =")}{xaRender(' ')}
        <code className="text-zinc-500">treasury_splitter</code> {xaRender(" après")}{xaRender(' ')}
        <code className="text-zinc-500">VITE_TREASURY_CODEHASH_OK</code>{xaRender(". Pas une promesse de rendement. ")}</p>
    </div>
  )
}
