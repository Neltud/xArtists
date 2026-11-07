import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Planned treasury-splitter init. Not a balance.
 * Source of the percents: scripts/deploy_treasury_splitter.sh
 * Mission 4000 · Reserve 3000 · Reward 2000 · Ops 1000.
 * The contract is not deployed. Hover explains a share; it does not move funds.
 */
import { useState } from 'react'

export const TREASURY_FEE_SLICES = [
  { id: 'mission', label: 'Mission', pct: 40, color: 'bg-purple-500', detail: 'Art program. Nothing has been sent here.' },
  { id: 'reserve', label: 'Reserve', pct: 30, color: 'bg-blue-500', detail: 'Risk buffer. Nothing has been sent here.' },
  { id: 'reward', label: 'Reward', pct: 20, color: 'bg-emerald-500', detail: 'Creator incentive. Nothing has been sent here.' },
  { id: 'ops', label: 'Ops', pct: 10, color: 'bg-amber-500', detail: 'Gas and operations. Nothing has been sent here.' },
] as const

export default function TreasurySplitViz() {
  const [active, setActive] = useState<string | null>(null)
  const slice = TREASURY_FEE_SLICES.find(s => s.id === active)

  return (
    <div className="card border-white/10 mb-4" data-testid="treasury-split-viz">
      <h3 className="text-sm font-bold mb-1">{xaRender("Treasury rule, not a balance")}</h3>
      <p className="text-[11px] text-[var(--xa-muted)] mb-3 leading-relaxed">
        {xaRender("These shares apply only to fees sent later into treasury-splitter. That contract is not deployed, so this bar is not a wallet balance.")}
      </p>
      <div className="flex items-end gap-px h-5 mb-3" role="list" aria-label="Treasury rule shares">
        {xaRender(TREASURY_FEE_SLICES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="listitem"
            aria-pressed={active === s.id}
            aria-label={s.label + ' ' + s.pct + '%'}
            className={s.color + ' rounded-sm min-w-0 transition-[height,filter] duration-200 ease-out motion-reduce:transition-none hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'}
            style={{ width: s.pct + '%', height: active === s.id ? 20 : 12 }}
            onMouseEnter={() => setActive(s.id)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(s.id)}
            onBlur={() => setActive(null)}
            onClick={() => setActive(current => current === s.id ? null : s.id)}
          />
        )))}
      </div>
      <ul className="grid grid-cols-2 gap-2 text-xs">
        {xaRender(TREASURY_FEE_SLICES.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={'flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-transform duration-200 motion-reduce:transition-none ' + (active === s.id ? '-translate-y-0.5 border-[var(--xa-border)]' : 'border-transparent')}
              onMouseEnter={() => setActive(s.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(s.id)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(current => current === s.id ? null : s.id)}
            >
              <span className={'w-2 h-2 rounded-full ' + s.color} />
              <span className="text-[var(--xa-muted)]">{xaRender(s.label)}</span>
              <span className="ml-auto font-semibold mono">{xaRender(String(s.pct))}%</span>
            </button>
          </li>
        )))}
      </ul>
      <p className="mt-3 min-h-[2.5rem] text-[11px] leading-relaxed text-[var(--xa-text)]" aria-live="polite">
        {xaRender(slice ? slice.detail : 'Hover or focus a share. This bar is not the burned TRO.')}
      </p>
      <p className="text-[10px] text-[var(--xa-muted)] leading-relaxed">
        {xaRender("TRO redistribution is another 40/30/20/10: pool, stake, rewards and burn. It is not this bar.")}
      </p>
      <p className="text-[10px] text-[var(--xa-muted)] mt-1">
        {xaRender("Planned init only. The owner could change the shares after a real deployment.")}
      </p>
    </div>
  )
}
