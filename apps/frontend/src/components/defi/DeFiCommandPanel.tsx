import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * DeFi Hub — Hatom / AshSwap / Soul · rails non-custodial xPortal.
 */
import { useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import TroLiquidityPanel from './TroLiquidityPanel'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { useToast } from '../ui/Toast'

export default function DeFiCommandPanel({ hideTroLiquidity = false }: { hideTroLiquidity?: boolean } = {}) {
  const { connected } = useWallet()
  const { push } = useToast()

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
        apyHint: 'APR / TVL xExchange · OneDex',
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
            {xaRender("DeFi Command ")}</p>
          <h2 className="text-lg font-bold text-white">{xaRender("Hatom · AshSwap · Soul")}</h2>
        </div>
        <Link to="/hatom" className="btn-secondary text-xs">
          {xaRender("Ouvrir Hatom → ")}</Link>
      </div>

      <p className="text-[11px] text-zinc-500">
        {xaRender("Signature ")}<strong className="text-zinc-300">{xaRender("xPortal")}</strong> {xaRender(" (non-custodial). Pas un conseil financier. Liquidité & pricing via APIs MultiversX (xExchange / OneDex). ")}</p>

      <div className="grid sm:grid-cols-3 gap-2">
        {xaRender(cards.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => onOpen(c.to, c.title)}
            className="text-left rounded-xl border border-white/10 bg-black/30 p-3 transition hover:border-cyan-400/30"
          >
            <p className="font-semibold text-sm text-white">{xaRender(c.title)}</p>
            <p className="text-[11px] text-zinc-400 mt-1">{xaRender(c.blurb)}</p>
            <p className="text-[10px] text-violet-300/80 mt-2">{xaRender(c.apyHint)}</p>
          </button>
        )))}
      </div>

      {xaRender(!hideTroLiquidity && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <TroLiquidityPanel />
        </div>
      ))}
    </div>
  )
}
