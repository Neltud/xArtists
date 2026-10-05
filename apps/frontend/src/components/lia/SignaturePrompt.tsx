/** Signature package viewer — copy calldata; sign external. */
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
}

export default function SignaturePrompt() {
  const [pkgs, setPkgs] = useState<Pkg[]>([])

  useEffect(() => {
    let c = false
    ;(async () => {
      const bases = [
        `${import.meta.env.BASE_URL || '/'}data/`,
        'https://neltud.github.io/xArtists/data/',
      ]
      for (const b of bases) {
        try {
          const r = await fetch(`${b}signature_packages.json`, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          if (!c) setPkgs(Array.isArray(j.packages) ? j.packages : [])
          return
        } catch {
          /* */
        }
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const open = pkgs.filter(p => p.status === 'waiting_signature' || !p.tx_hash)

  return (
    <section className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.04] p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-fuchsia-200/90 font-semibold">
        Signature bridge
      </p>
      {!open.length && (
        <p className="text-[11px] text-zinc-600">
          No package — run decision_chain then signature_bridge --from-decision
        </p>
      )}
      {open.slice(0, 3).map(p => (
        <div key={asText(p.id)} className="rounded-lg bg-black/40 border border-white/5 p-2 space-y-2">
          <p className="text-[11px] text-white">
            {asText(p.action_type)} {asText(p.pair)} · {asText(p.amount_egld)} EGLD
          </p>
          <p className="text-[10px] text-zinc-500">{asText(p.reason)}</p>
          {(p.txs || []).map(t => (
            <div key={asText(t.step)} className="text-[10px] space-y-1 border-t border-white/5 pt-1">
              <p className="text-zinc-400">
                Step {asText(t.step)} · {asText(t.label)} · gas {asText(t.gasLimit)}
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
          <p className="text-[9px] text-zinc-600">
            Sign externally → then ops: signature_bridge --match &lt;txHash&gt;
          </p>
        </div>
      ))}
    </section>
  )
}
