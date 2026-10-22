import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
import { Link } from 'react-router-dom'
import { isSupernovaLive } from '../config/supernova'
import { VIRTUAL_MUSEUMS } from '../lib/museumWorldCatalog'

/** Home truth strip — always GO_DEMO until contracts.json says otherwise. */
export default function SoftStatus() {
  xaUsePhraseLocale()

  const sn = isSupernovaLive()
  const n = VIRTUAL_MUSEUMS?.length ?? 0

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 text-[12px] text-zinc-500 backdrop-blur-sm">
      <p className="flex flex-wrap gap-x-2 gap-y-1 items-center">
        <span className="text-amber-400/90 font-medium">{xaRender("GO_DEMO")}</span>
        <span className="text-zinc-700">·</span>
        <span className="text-amber-400/80 font-medium">{xaRender("Paper")}</span>
        <span className="text-zinc-700">·</span>
        <span>{xaRender("SC off")}</span>
        <span className="text-zinc-700">·</span>
        <span>{xaRender("Trading off")}</span>
        {xaRender(sn && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="text-cyan-400/85">{xaRender("Supernova")}</span>
          </>
        ))}
        {xaRender(n > 0 && (
          <>
            <span className="text-zinc-700">·</span>
            <span>{xaRender(n)} {xaRender(" musées")}</span>
          </>
        ))}
      </p>
      <p className="mt-1.5 text-zinc-600">
        <Link to="/museum" className="text-zinc-400 hover:text-white transition-colors">
          {xaRender("Galerie ")}</Link>
        <span className="mx-1.5 text-zinc-700">·</span>
        <Link to="/agents" className="text-zinc-400 hover:text-white transition-colors">
          {xaRender("Packs ")}</Link>
        <span className="mx-1.5 text-zinc-700">·</span>
        <Link to="/my-packs" className="text-zinc-400 hover:text-white transition-colors">
          {xaRender("My Packs ")}</Link>
        <span className="mx-1.5 text-zinc-700">·</span>
        <span className="text-zinc-600" title={xaLocalize("data/contracts.json")}>
          {xaRender("codeHash null ")}</span>
      </p>
    </div>
  )
}
