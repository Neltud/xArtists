import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Public markets — provenance-aware analysis, risk and on-chain context.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import MarketPage from './MarketPage'
import XorusDecisionDesk from '../components/intelligence/XorusDecisionDesk'
import TroHolderBoard from '../components/analytics/TroHolderBoard'
import TroLiquidityPanel from '../components/defi/TroLiquidityPanel'

type Tab = 'dashboard' | 'liquidity' | 'holders'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: '📊 Marchés et décision xOrus' },
  { id: 'liquidity', label: '💧 Liquidité & Farming $TRO' },
  { id: 'holders', label: '🏆 Indexation & Top Holders' },
]

export default function MarketAnalyticsPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="space-y-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-[#2a2a3a] overflow-x-auto">
          {xaRender(TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-medium transition-colors ${
                tab === t.id
                  ? 'bg-cyan-600/25 text-cyan-100 border border-cyan-400/30'
                  : 'text-zinc-500 hover:text-white border border-transparent'
              }`}
            >
              {xaRender(t.label)}
            </button>
          )))}
        </div>
      </div>

      {xaRender(tab === 'dashboard' && (
        <div className="space-y-6">
          <MarketPage />
          <div className="mx-auto max-w-5xl space-y-4">
            <XorusDecisionDesk />
            <p role="note" className="px-3 text-sm text-[color:var(--xa-text-secondary)]">
              Les anciens tableaux de scores construits à partir de prix fictifs ont été retirés de cette page.
              Consultez les décisions et leurs preuves sur <Link to="/intelligence/xorus" className="underline underline-offset-2">xOrus</Link>.
            </p>
          </div>
        </div>
      ))}
      {xaRender(tab === 'liquidity' && (
        <div className="max-w-4xl mx-auto">
          <TroLiquidityPanel />
        </div>
      ))}
      {xaRender(tab === 'holders' && (
        <div className="max-w-4xl mx-auto">
          <TroHolderBoard />
        </div>
      ))}
    </div>
  )
}
