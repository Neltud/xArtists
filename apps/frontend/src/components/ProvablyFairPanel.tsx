/**
 * Provably fair receipt UI — client seed editable + hashes.
 */
import { useEffect, useState } from 'react'
import { buildFairReceipt, randomClientSeed, type FairReceipt } from '../lib/provablyFair'

type Props = {
  clientSeed: string
  onClientSeed: (s: string) => void
  txSessionId?: string | null
  serverCommit?: string | null
}

export default function ProvablyFairPanel({
  clientSeed,
  onClientSeed,
  txSessionId,
  serverCommit,
}: Props) {
  const [receipt, setReceipt] = useState<FairReceipt | null>(null)

  useEffect(() => {
    let cancelled = false
    void buildFairReceipt(clientSeed, serverCommit, txSessionId).then(r => {
      if (!cancelled) setReceipt(r)
    })
    return () => {
      cancelled = true
    }
  }, [clientSeed, serverCommit, txSessionId])

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2 text-[11px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="uppercase tracking-wider text-zinc-500 font-tech">Provably fair</p>
        <button
          type="button"
          className="text-cyan-400 hover:underline"
          onClick={() => onClientSeed(randomClientSeed())}
        >
          new client seed
        </button>
      </div>
      <label className="block space-y-1">
        <span className="text-zinc-500">Client seed</span>
        <input
          className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 mono text-[11px] text-zinc-200"
          value={clientSeed}
          onChange={e => onClientSeed(e.target.value.slice(0, 64))}
          spellCheck={false}
        />
      </label>
      {receipt && (
        <div className="space-y-1 mono text-zinc-500 break-all">
          <p>
            <span className="text-zinc-400">sha256(client)</span> {receipt.clientSeedHash.slice(0, 24)}…
          </p>
          <p>
            <span className="text-zinc-400">hint</span> {receipt.combinedHint}
          </p>
          {txSessionId && (
            <p>
              <span className="text-zinc-400">tx session</span> {txSessionId}
            </p>
          )}
        </div>
      )}
      <p className="text-zinc-600 leading-snug">
        On-chain: spinEgld@hex(client_seed). Après resolve, croiser explorer + seed pour audit.
      </p>
    </div>
  )
}
