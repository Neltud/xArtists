import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/** Disclosure économique B2B — packs / LIA treasury / rewards. */

export default function EconomicDisclosure({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[10px] text-zinc-500 leading-relaxed">
        {xaRender("Pack NFT = accès · pas de dépôt utilisateur · fraction mint → fonds LIA · rewards discrétionnaires selon PnL & packs actifs. ")}</p>
    )
  }
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 space-y-1.5 text-[11px] text-zinc-400 leading-relaxed">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-tech">{xaRender("Économie Pack")}</p>
      <p>
        <strong className="text-zinc-200">{xaRender("Aucun dépôt requis.")}</strong> {xaRender(" Acquisition unique du Pack NFT — aucun dépôt de trésorerie requis de votre part. ")}</p>
      <p>
        <strong className="text-zinc-200">{xaRender("Financement LIA.")}</strong> {xaRender(" Une fraction du mint alimente directement le fonds d’arbitrage de LIA. ")}</p>
      <p>
        <strong className="text-zinc-200">{xaRender("Rewards discrétionnaires.")}</strong> {xaRender(" Distribution calculée selon le PnL global de LIA et pondérée par le nombre de Packs actifs dans votre wallet. Non garantie · pas un conseil financier. ")}</p>
    </div>
  )
}
