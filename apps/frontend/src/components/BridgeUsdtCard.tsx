/**
 * Pont stablecoins → MultiversX via XOXNO (USDT0 / LayerZero path).
 * External product — xArtists n’opère pas le bridge.
 */
import { LINKS } from '../config/links'

export default function BridgeUsdtCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] ${
        compact ? 'px-3 py-2.5' : 'px-4 py-3.5'
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Stablecoins → MultiversX
      </p>
      <p className={`text-sm text-zinc-300 mt-1.5 leading-relaxed ${compact ? '' : 'max-w-md'}`}>
        Amenez du <span className="text-white font-medium">USDT</span> (chemin USDT0 / LayerZero)
        vers MultiversX via le bridge XOXNO — puis packs, galerie, market.
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <a
          href={LINKS.xoxnoBridge}
          target="_blank"
          rel="noreferrer"
          className="btn-primary text-xs !py-2"
        >
          Bridge XOXNO
        </a>
        <a
          href={LINKS.usdt0}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-xs !py-2"
        >
          USDT0
        </a>
      </div>
      <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">
        Service tiers (XOXNO / USDT0). Pas opéré par xArtists. Vérifiez toujours l’URL et le réseau.
      </p>
    </div>
  )
}
