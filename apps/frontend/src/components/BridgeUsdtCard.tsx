import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Pont stablecoins → MultiversX (XOXNO / USDT0) — externe, discret.
 */


export default function BridgeUsdtCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.02] ${
        compact ? 'px-3.5 py-3' : 'px-4 py-3.5'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
        {xaRender("Financer le wallet ")}</p>
      <p className={`text-[13px] text-zinc-400 mt-1 leading-relaxed ${compact ? '' : 'max-w-md'}`}>
        {xaRender("USDT via XOXNO (chemin USDT0) vers MultiversX. ")}</p>
      <div className="flex flex-wrap gap-2 mt-2.5">
        <span className="text-xs text-amber-200">
          {xaRender("Lien bridge indisponible — aucun swap initié par xArtists")}
        </span>
        {xaRender(!compact && (
          <span className="text-xs text-zinc-500">USDT0 · consulter uniquement les sources officielles avant d’envoyer des fonds</span>
        ))}
      </div>
    </div>
  )
}
