import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useWallet } from '../context/WalletContext'
import AccessTermsModal from './AccessTermsModal'
import { canBuyAgent } from '../config/scStatus'

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
  const mintLive = canBuyAgent()

  const startBuy = (id: PackId) => {
    if (!connected || !address?.startsWith('erd1')) {
      setMsg('Connecte ton wallet MultiversX (erd1…) avant checkout — le NFT part vers cette adresse.')
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
        mint_sc_live: mintLive,
        ts: new Date().toISOString(),
      }
      try {
        localStorage.setItem('xartists_access_checkout_intent', JSON.stringify(intent))
      } catch {
        /* ignore */
      }
      setMsg(
        `Conditions acceptées. Intent enregistré pour ${pack.name} (${pack.priceEur.list} €). ` +
          (mintLive
            ? 'SC agents live — brancher Stripe/webhook pour mint.'
            : 'SC agents non déployé (codeHash). Intent paper uniquement.')
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
      setMsg(`Session ${data.id || ''} créée sans URL — vérifier Stripe.`)
      setStatus('done')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Checkout échoué')
      setStatus('idle')
    }
  }

  return (
    <div className="card border-purple-500/20">
      <h3 className="font-bold text-sm mb-1">Checkout packs (Model C)</h3>
      <p className="text-[11px] text-zinc-500 mb-4">
        Paiement fiat → mint NFT pack vers ton erd1. Sans API Stripe : intent local paper.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {AGENT_PACKS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => startBuy(p.id)}
            className={`rounded-xl border px-3 py-3 text-left transition-colors ${
              selected === p.id
                ? 'border-cyan-400/50 bg-cyan-500/10'
                : p.id === 'voyage'
                  ? 'border-amber-500/30 bg-amber-950/20 hover:border-amber-400/40'
                  : 'border-white/10 bg-white/5 hover:border-purple-400/40'
            }`}
          >
            <span className="text-lg">{p.icon}</span>
            <p className="text-xs font-bold text-white mt-1">{p.name}</p>
            <p className="text-[10px] text-zinc-500">{p.priceEur.list} €</p>
          </button>
        ))}
      </div>

      {msg && (
        <p className="text-xs text-amber-100/90 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 mb-3">
          {msg}
        </p>
      )}

      {status === 'done' && selected === 'voyage' && (
        <Link to="/agents/voyage" className="btn-primary text-xs py-2 px-3 inline-block mb-2">
          Voir l’agent Voyage →
        </Link>
      )}

      {!connected && (
        <p className="text-[11px] text-zinc-500">Connecte un wallet pour démarrer le checkout.</p>
      )}

      <AccessTermsModal
        open={termsOpen}
        packName={pack?.name || ''}
        onClose={() => {
          setTermsOpen(false)
          setStatus('idle')
        }}
        onAccept={onAcceptTerms}
      />
    </div>
  )
}
