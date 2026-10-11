/**
 * DeFi Command — Hatom / AshSwap / Soul · rails non-custodial xPortal.
 * Badge B2B Finance Computer.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import FinanceComputerBadge from '../FinanceComputerBadge'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { useToast } from '../ui/Toast'
import TroLiquidityPanel from './TroLiquidityPanel'

type CardId = 'supply' | 'swap' | 'soul'

const CARDS: {
  id: CardId
  title: string
  blurb: string
  apyHint: string
  href: string
}[] = [
  {
    id: 'supply',
    title: 'Supply Hatom',
    blurb: 'Déposer EGLD / USDC en lending Hatom (signature xPortal).',
    apyHint: 'APY live via panel Hatom',
    href: '/hatom',
  },
  {
    id: 'swap',
    title: 'Swap AshSwap',
    blurb: 'Échange ESDT via agrégateur — non-custodial.',
    apyHint: 'Routes + slippage côté wallet',
    href: '/hatom',
  },
  {
    id: 'soul',
    title: 'Soul / Liquidité',
    blurb: 'Pools & farms $TRO (xExchange / OneDex) en lecture + liens.',
    apyHint: 'APR / TVL rafraîchis',
    href: '/staking',
  },
]

export default function DeFiCommandPanel({ hideTroLiquidity = false }: { hideTroLiquidity?: boolean } = {}) {
  const { connected, canAttemptSign } = useWallet()
  const { push } = useToast()
  const [active, setActive] = useState<CardId | null>(null)

  const onCard = (id: CardId) => {
    setActive(id)
    if (!connected) {
      push('Connecte xPortal pour les actions DeFi', 'info')
      requestOpenConnect()
      return
    }
    if (!canAttemptSign) {
      push('Signature non disponible — reconnecte le wallet', 'err')
      return
    }
    const c = CARDS.find(x => x.id === id)
    if (c) {
      push(`${c.title} — ouvre le rail dédié`, 'ok')
      if (typeof window !== 'undefined') {
        window.location.hash = `#${c.href}`
      }
    }
  }

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
        Actions signées dans <strong className="text-zinc-300">xPortal</strong> (non-custodial). Pas un
        conseil financier. Métriques liquidité via Finance Computer / APIs publiques.
      </p>

      <div className="grid sm:grid-cols-3 gap-2">
        {CARDS.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCard(c.id)}
            className={`text-left rounded-xl border p-3 transition ${
              active === c.id
                ? 'border-cyan-400/40 bg-cyan-500/10'
                : 'border-white/10 bg-black/30 hover:border-white/20'
            }`}
          >
            <p className="font-semibold text-sm text-white">{c.title}</p>
            <p className="text-[11px] text-zinc-400 mt-1">{c.blurb}</p>
            <p className="text-[10px] text-violet-300/80 mt-2">{c.apyHint}</p>
          </button>
        ))}
      </div>

      {!hideTroLiquidity && (
        <div className="pt-2 border-t border-white/10">
          <TroLiquidityPanel />
        </div>
      )}
    </div>
  )
}
