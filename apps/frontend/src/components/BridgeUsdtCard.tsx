/**
 * Pont stablecoins → MultiversX (XOXNO / USDT0) — externe, discret.
 */
import { LINKS } from '../config/links'

export default function BridgeUsdtCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.02] ${
        compact ? 'px-3.5 py-3' : 'px-4 py-3.5'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
        Financer le wallet
      </p>
      <p className={`text-[13px] text-zinc-400 mt-1 leading-relaxed ${compact ? '' : 'max-w-md'}`}>
        USDT via XOXNO (chemin USDT0) vers MultiversX.
      </p>
      <div className="flex flex-wrap gap-2 mt-2.5">
        <a
          href={LINKS.xoxnoBridge}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-xs !py-1.5"
        >
          Bridge XOXNO
        </a>
        {!compact && (
          <a
            href={LINKS.usdt0}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost text-xs !py-1.5"
          >
            USDT0
          </a>
        )}
      </div>
    </div>
  )
}
