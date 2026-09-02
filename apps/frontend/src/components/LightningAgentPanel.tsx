import { useEffect, useState } from 'react'

type LightningDoc = {
  name?: string
  provider?: string
  package?: string
  status?: string
  chain?: string
  docs_url?: string
  install?: { mcp?: string; cli?: string }
  capabilities?: string[]
  xartists_policy?: {
    front?: string
    vellum?: string
    live_flag?: string
    segregate_from_mvx_ops?: boolean
  }
}

/** Lightning Faucet MCP — BTC Lightning for AI agents (ops), not MultiversX. */
export default function LightningAgentPanel({ compact = false }: { compact?: boolean }) {
  const [doc, setDoc] = useState<LightningDoc | null>(null)

  useEffect(() => {
    let c = false
    const urls = [
      `${import.meta.env.BASE_URL}data/lightning_agent.json`,
      'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lightning_agent.json',
    ]
    ;(async () => {
      for (const url of urls) {
        try {
          const r = await fetch(`${url}?t=${Date.now()}`)
          if (!r.ok) continue
          const j = await r.json()
          if (!c) setDoc(j)
          return
        } catch {
          /* next */
        }
      }
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <div
      className={`card border-orange-500/30 bg-gradient-to-br from-orange-950/30 to-purple-950/20 ${
        compact ? 'mb-4' : 'mb-6'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-orange-400/90">Bitcoin Lightning · MCP</p>
          <h3 className="text-lg font-black text-white">
            {doc?.name || 'Lightning Agent Wallet'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Donne à un agent IA (LIA / Claude / Cursor) un wallet Lightning pour micropaiements L402 —
            via <code className="text-orange-200/90">lightning-wallet-mcp</code>. Ce n’est pas MultiversX.
          </p>
        </div>
        <span className="text-[10px] uppercase px-2 py-1 rounded-full border border-orange-500/40 text-orange-200 bg-orange-500/10">
          {(doc?.status || 'optional_ops_mcp').replace(/_/g, ' ')}
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-orange-100/90 mb-3 overflow-x-auto">
        $ {doc?.install?.mcp || 'npx -y lightning-wallet-mcp'}
      </div>

      {!compact && (
        <ul className="text-xs text-zinc-400 space-y-1 mb-3 list-disc pl-4">
          {(doc?.capabilities || ['balance', 'L402 pay', 'register_operator']).map(cap => (
            <li key={cap}>{cap}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 text-[11px]">
        <a
          href={doc?.docs_url || 'https://lightningfaucet.com/build/'}
          target="_blank"
          rel="noreferrer"
          className="btn-primary text-xs py-2 px-3"
        >
          Docs Lightning Faucet ↗
        </a>
        <a
          href="https://www.npmjs.com/package/lightning-wallet-mcp"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-xs py-2 px-3"
        >
          npm package ↗
        </a>
      </div>

      <p className="text-[10px] text-zinc-600 mt-3 border-t border-white/5 pt-2">
        Policy xArtists : front = doc/status only · Vellum ops peut brancher le MCP · flag{' '}
        <code className="text-zinc-500">{doc?.xartists_policy?.live_flag || 'LIGHTNING_AGENT_LIVE'}</code>{' '}
        · trésorerie Lightning séparée du wallet EGLD LIA.
      </p>
    </div>
  )
}
