/** Signature package — copy calldata; optional waiting-for-chain state. */
import { useEffect, useState } from 'react'
import { asText } from '../../lib/safeRender'

type Tx = {
  step?: number
  receiver?: string
  value?: string
  value_egld?: number
  data?: string
  gasLimit?: number
  label?: string
}

type Pkg = {
  id?: string
  status?: string
  action_type?: string
  pair?: string
  amount_egld?: number
  reason?: string
  txs?: Tx[]
  tx_hash?: string
  explorer?: string
}

export default function SignaturePrompt() {
  const [pkgs, setPkgs] = useState<Pkg[]>([])
  const [waitingId, setWaitingId] = useState<string | null>(null)

  const reload = async () => {
    const bases = [
      `${import.meta.env.BASE_URL || '/'}data/`,
      'https://neltud.github.io/xArtists/data/',
    ]
    for (const b of bases) {
      try {
        const r = await fetch(`${b}signature_packages.json`, { cache: 'no-store' })
        if (!r.ok) continue
        const j = await r.json()
        setPkgs(Array.isArray(j.packages) ? j.packages : [])
        return
      } catch {
        /* */
      }
    }
  }

  useEffect(() => {
    void reload()
    const id = window.setInterval(() => void reload(), 15_000)
    return () => window.clearInterval(id)
  }, [])

  const open = pkgs.filter(p => p.status === 'waiting_signature' || (!p.tx_hash && p.status !== 'executed_on_chain'))
  const done = pkgs.filter(p => p.tx_hash || p.status === 'executed_on_chain')

  return (
    <section className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.04] p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-fuchsia-200/90 font-semibold">
        Signature bridge
      </p>

      {!open.length && !done.length && (
        <p className="text-[11px] text-zinc-600">
          No package — decision_chain then signature_bridge --from-decision
        </p>
      )}

      {open.slice(0, 3).map(p => {
        const id = String(p.id || '')
        const isWaiting = waitingId === id
        return (
          <div key={id} className="rounded-lg bg-black/40 border border-white/5 p-2 space-y-2">
            <p className="text-[11px] text-white">
              {asText(p.action_type)} {asText(p.pair)} · {asText(p.amount_egld)} EGLD
            </p>
            <p className="text-[10px] text-zinc-500">{asText(p.reason)}</p>
            {(p.txs || []).map(t => (
              <div key={asText(t.step)} className="text-[10px] space-y-1 border-t border-white/5 pt-1">
                <p className="text-zinc-400">
                  Step {asText(t.step)} · {asText(t.label)} · gas {asText(t.gasLimit)} · value{' '}
                  {asText(t.value_egld ?? t.value)} EGLD
                </p>
                <p className="mono text-zinc-500 truncate">to {asText(t.receiver)}</p>
                <button
                  type="button"
                  className="btn-secondary text-[10px] !py-0.5"
                  onClick={() => void navigator.clipboard?.writeText(String(t.data || ''))}
                >
                  Copy calldata
                </button>
                <button
                  type="button"
                  className="btn-secondary text-[10px] !py-0.5 ml-1"
                  onClick={() =>
                    void navigator.clipboard?.writeText(
                      JSON.stringify(
                        {
                          receiver: t.receiver,
                          value: t.value,
                          data: t.data,
                          gasLimit: t.gasLimit,
                        },
                        null,
                        2,
                      ),
                    )
                  }
                >
                  Copy full step
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-[10px] text-fuchsia-300 underline"
              onClick={() => setWaitingId(id)}
            >
              I signed — wait for on-chain
            </button>
            {isWaiting && (
              <p className="text-[10px] text-amber-300/90 animate-pulse flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                Waiting for on-chain confirmation — ops runs signature_bridge --match &lt;txHash&gt;
              </p>
            )}
          </div>
        )
      })}

      {done.slice(0, 2).map(p => (
        <p key={asText(p.id)} className="text-[10px] text-emerald-400/90">
          Executed{' '}
          {p.tx_hash ? (
            <a
              className="underline"
              href={p.explorer || `https://explorer.multiversx.com/transactions/${p.tx_hash}`}
              target="_blank"
              rel="noreferrer"
            >
              {asText(p.tx_hash.slice(0, 12))}…
            </a>
          ) : (
            'on-chain'
          )}
        </p>
      ))}
    </section>
  )
}
