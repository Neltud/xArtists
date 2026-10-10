/**
 * /market — analyse publique + matrice + holders (onglets, anti-scroll).
 */
import { useState } from 'react'
import MarketPage from './MarketPage'
import MatrixBoard from '../components/lia/MatrixBoard'
import TroHolderBoard from '../components/analytics/TroHolderBoard'
import TroLiquidityPanel from '../components/defi/TroLiquidityPanel'

type Tab = 'dashboard' | 'liquidity' | 'holders'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: '📊 Dashboard Hub & Signals' },
  { id: 'liquidity', label: '💧 Liquidité & Farming $TRO' },
  { id: 'holders', label: '🏆 Indexation & Top Holders' },
]

export default function MarketAnalyticsPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="space-y-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-[#2a2a3a] overflow-x-auto">
          {TABS.map(t => (
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
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <MarketPage />
          <div className="max-w-4xl mx-auto">
            <MatrixBoard />
          </div>
        </div>
      )}
      {tab === 'liquidity' && (
        <div className="max-w-4xl mx-auto">
          <TroLiquidityPanel />
        </div>
      )}
      {tab === 'holders' && (
        <div className="max-w-4xl mx-auto">
          <TroHolderBoard />
        </div>
      )}
    </div>
  )
}
