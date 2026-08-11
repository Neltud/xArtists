import { useState } from 'react'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useWallet } from '../context/WalletContext'
import AccessTermsModal from './AccessTermsModal'

/**
 * Access Pack checkout — Model C.
 * Real Stripe session requires ACCESS_API_BASE backend.
 * Without API: records local intent + shows honest next steps.
 */
export default function PackCheckout() {
  const { connected, address } = useWallet()
  const [selected, setSelected] = useState<PackId | null>(null)
  const [termsOpen, setTermsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'terms' | 'redirect' | 'done'>('idle')
  const [msg, setMsg] = useState('')

  const pack = AGENT_PACKS.find(p => p.id === selected)
  const apiBase = (import.meta.env.VITE_ACCESS_API_BASE as string | undefined) || ''

  const startBuy = (id: PackId) => {
    if (!connected || !address?.startsWith('erd1')) {
      setMsg('Connect your MultiversX wallet (erd1…) before checkout — NFT is minted to that address.')
      return
    }
    setSelected(id)
    setTermsOpen(true)
    setStatus('terms')
    setMsg('')
  }

  const onAcceptTerms = async () => {
    setTermsOpen(false)
    if (!pack || !address) return
    setStatus('redirect')

    if (!apiBase) {
      const intent = {
        product: 'access_pack',
        model: 'C',
        pack_id: pack.id,
        price_eur: pack.priceEur.list,
        buyer_address: address,
        paper_only: true,
        ts: new Date().toISOString(),
      }
      try {
        localStorage.setItem('xartists_access_checkout_intent', JSON.stringify(intent))
      } catch {
        /* ignore */
      }
      setMsg(
        `Terms accepted. Intent saved for ${pack.name} (${pack.priceEur.list} €). ` +
          `Wire VITE_ACCESS_API_BASE + Stripe to open live Checkout. Mint runs only after verified webhook.`
      )
      setStatus('done')
      return
    }

    try {
      const r = await fetch(`${apiBase}/v1/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: pack.id, buyer_address: address }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = (await r.json()) as { url?: string; id?: string }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setMsg(`Session ${data.id || ''} created but no URL — check Stripe keys.`)
      setStatus('done')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Checkout failed')
      setStatus('idle')
    }
  }

  return (
    <section className="card border-purple-500/25 mb-6">
      <h3 className="font-bold text-purple-200 mb-1">Purchase Access Pack</h3>
      <p className="text-xs text-zinc-500 mb-4">
        Fiat → membership NFT · <strong className="text-amber-200/80">Model C</strong> · paper performance
        only · not a fund
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {AGENT_PACKS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => startBuy(p.id)}
            className={`text-left rounded-xl border px-3 py-3 transition-colors ${
              selected === p.id
                ? 'border-purple-500 bg-purple-500/15'
                : 'border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <span className="text-xl">{p.icon}</span>
            <p className={`font-semibold text-sm mt-1 ${p.color}`}>{p.name}</p>
            <p className="text-lg font-black text-white">{p.priceEur.list} €</p>
            <p className="text-[10px] text-zinc-500 mt-1">Signaux {'●'.repeat(p.signalIntensity)}</p>
          </button>
        ))}
      </div>
      {msg && <p className="text-xs text-amber-200/90 mt-4 leading-relaxed">{msg}</p>}
      {status === 'redirect' && (
        <p className="text-xs text-zinc-400 mt-2" role="status">
          Opening secure payment…
        </p>
      )}
      <AccessTermsModal
        open={termsOpen && !!pack}
        packName={pack?.name || ''}
        priceEur={pack?.priceEur.list || 0}
        onAccept={onAcceptTerms}
        onCancel={() => {
          setTermsOpen(false)
          setStatus('idle')
        }}
      />
    </section>
  )
}
