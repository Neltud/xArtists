/**
 * LIA + GrokyversX — protocol agents (read-only links, never Connect).
 */
import { LINKS, LIA_WALLET, GROK_WALLET } from '../config/links'
import { GROKYVERSX } from '../config/grokyversx'

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

export default function AgentWalletsStrip() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 space-y-2">
      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Agents on-chain</p>
      <div className="grid sm:grid-cols-2 gap-2 text-[12px]">
        <a
          href={LINKS.liaExplorer}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2 hover:border-violet-400/40 transition-colors"
        >
          <span>
            <span className="font-semibold text-violet-200">LIA</span>
            <span className="text-zinc-500 ml-2">ops · board</span>
          </span>
          <span className="mono text-zinc-400">{short(LIA_WALLET)}</span>
        </a>
        <a
          href={LINKS.grokyversxExplorer}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-3 py-2 hover:border-cyan-400/40 transition-colors"
        >
          <span>
            <span className="font-semibold text-cyan-200">{GROKYVERSX.name}</span>
            <span className="text-zinc-500 ml-2">trader</span>
          </span>
          <span className="mono text-zinc-400">{short(GROK_WALLET)}</span>
        </a>
      </div>
      <p className="text-[11px] text-zinc-600">
        Adresses protocole — pas le bouton Connect utilisateur.
      </p>
    </div>
  )
}
