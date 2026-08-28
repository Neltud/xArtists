import { Link } from 'react-router-dom'

/** Private / early-access honesty strip — no false production claims. */
const SUPERNOVA_UTC = Date.UTC(2026, 8, 10) // 10 Sep 2026 activation
const NODE_UPGRADE_UTC = Date.UTC(2026, 8, 1) // 1 Sep 2026 node upgrade

function daysUntil(utcMs: number): number {
  return Math.ceil((utcMs - Date.now()) / 86_400_000)
}

function supernovaLabel(): string {
  const days = daysUntil(SUPERNOVA_UTC)
  if (days > 1) return `Supernova activation ${days} j`
  if (days === 1) return 'Supernova activation demain'
  if (days === 0) return 'Supernova activation aujourd’hui'
  return 'Supernova mainnet'
}

function nodeUpgradeLabel(): string | null {
  const days = daysUntil(NODE_UPGRADE_UTC)
  if (days > 1) return `upgrade nodes ${days} j`
  if (days === 1) return 'upgrade nodes demain'
  if (days === 0) return 'upgrade nodes aujourd’hui'
  return null
}

export default function PrivateReleaseStrip() {
  const node = nodeUpgradeLabel()
  return (
    <div
      className="border-b border-violet-500/20 bg-violet-950/30 px-3 py-1.5 text-center text-[11px] text-violet-200/90"
      role="status"
    >
      <span className="font-semibold text-violet-100">Private release</span>
      <span className="mx-1.5 text-violet-500">·</span>
      Paper LIA · market on-chain seulement après codeHash · pas de promesse de performance
      {node && (
        <>
          <span className="mx-1.5 text-violet-500">·</span>
          <span className="text-violet-300/80">{node}</span>
        </>
      )}
      <span className="mx-1.5 text-violet-500">·</span>
      <span className="text-violet-300/80">{supernovaLabel()}</span>
      <span className="mx-1.5 text-violet-500">·</span>
      <Link to="/marketplace" className="underline text-violet-100/90 hover:text-white">
        Market
      </Link>
      <span className="mx-1 text-violet-600">/</span>
      <Link to="/portfolio" className="underline text-violet-100/90 hover:text-white">
        LIA
      </Link>
      <span className="mx-1 text-violet-600">/</span>
      <Link to="/wallet" className="underline text-violet-100/90 hover:text-white">
        Wallet
      </Link>
    </div>
  )
}
