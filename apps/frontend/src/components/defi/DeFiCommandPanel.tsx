/**
 * DeFi Hub — Hatom / AshSwap / Soul · feedback Copié !
 * Badge B2B Finance Computer API.
 */
import { useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import FinanceComputerBadge from '../FinanceComputerBadge'
import TroLiquidityPanel from './TroLiquidityPanel'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { useToast } from '../ui/Toast'

export default function DeFiCommandPanel({ hideTroLiquidity = false }: { hideTroLiquidity?: boolean } = {}) {
  const { connected } = useWallet()
  const { push } = useToast()
  const [copied, setCopied] = useState<string | null>(null)

  const cards = useMemo(
    () => [
      {
        id: 'supply',
        title: 'Supply Hatom',
        blurb: 'Lending EGLD / USDC — signature xPortal non-custodiale.',
        apyHint: 'APY affiché sur /hatom',
        to: '/hatom',
      },
      {
        id: 'swap',
        title: 'Swap / Routes',
        blurb: 'Échanges ESDT (AshSwap & agrégateurs) via wallet.',
        apyHint: 'Slippage & routes côté wallet',
        to: '/hatom',
      },
      {
        id: 'soul',
        title: 'Liquidité $TRO',
        blurb: 'Farms xExchange / OneDex — métriques live.',
        apyHint: 'APR / TVL Finance Computer + API MX',
        to: '/staking',
      },
    ],
    [],
  )

  const onOpen = useCallback(
    (to: string, title: string) => {
      if (!connected) {
        push('Connecte xPortal pour les actions DeFi', 'info')
        requestOpenConnect()
      }
      push(`${title} — rail ouvert`, 'ok')
      if (typeof window !== 'undefined') {
        window.location.hash = `#${to}`
      }
    },
    [connected, push],
  )

  return (
    <div className="glass-hud p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-tech uppercase tracking-[0.2em] text-cyan-300/90">
            DeFi Command
          </p>
          <h2 className="text-lg font-bold text-white">Hatom · AshSwap · Soul</h2>
          <FinanceComputerBadge className="mt-1.5" />
        </div>
        <Link to="/hatom" className="btn-secondary text-xs">
          Ouvrir Hatom →
        </Link>
      </div>

      <p className="text-[11px] text-zinc-500">
        Signature <strong className="text-zinc-300">xPortal</strong> (non-custodial). Pas un conseil
        financier. Liquidité & pricing assistés par Finance Computer / APIs MultiversX.
      </p>

      <div className="grid sm:grid-cols-3 gap-2">
        {cards.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => onOpen(c.to, c.title)}
            className="text-left rounded-xl border border-white/10 bg-black/30 p-3 transition hover:border-cyan-400/30"
          >
            <p className="font-semibold text-sm text-white">{c.title}</p>
            <p className="text-[11px] text-zinc-400 mt-1">{c.blurb}</p>
            <p className="text-[10px] text-violet-300/80 mt-2">{c.apyHint}</p>
          </button>
        ))}
      </div>

      {!hideTroLiquidity && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <TroLiquidityPanel />
        </div>
      )}

      {copied && (
        <p className="text-[11px] text-emerald-300/90">Copié : {copied}</p>
      )}
    </div>
  )
}
