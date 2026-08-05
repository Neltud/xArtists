import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { PACK_PRICE_EUR } from '../config/multichain'

export default function CreateSubAgentForm() {
  const { connected, address } = useWallet()
  const [prompt, setPrompt] = useState('')
  const [name, setName] = useState('')
  const [priceEur, setPriceEur] = useState('10')
  const [msg, setMsg] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim().length < 8) {
      setMsg('Prompt trop court (min 8 caractères).')
      return
    }
    const eur = Number(priceEur)
    if (!Number.isFinite(eur) || eur < PACK_PRICE_EUR.min || eur > PACK_PRICE_EUR.max) {
      setMsg(`Prix pack : ${PACK_PRICE_EUR.min}–${PACK_PRICE_EUR.max} € uniquement.`)
      return
    }
    const intent = {
      action: 'create_subagent',
      prompt: prompt.trim().slice(0, 2000),
      name: name.trim() || undefined,
      price_eur: eur,
      price_bounds: PACK_PRICE_EUR,
      creator: connected && address ? address : 'anonymous',
      product: 'lia_subagent_pack',
      not: 'greensmoke_forecast_agent',
      note: 'Vellum lia.agents.vellum_provision — list after agents_marketplace live',
    }
    try {
      localStorage.setItem('xartists_subagent_intent', JSON.stringify(intent))
    } catch {
      /* ignore */
    }
    setMsg(
      `Intent pack ${eur} € enregistré. ≠ GreenSmoke. List on-chain après deploy agents_marketplace.`
    )
  }

  return (
    <form onSubmit={onSubmit} className="card border-purple-500/20 space-y-3">
      <h3 className="font-semibold text-sm text-purple-200">Créer un Agent Pack (NFT limité)</h3>
      <p className="text-[11px] text-gray-500">
        Produit <strong>LIA sub-agent</strong> · prix <strong>{PACK_PRICE_EUR.min}–{PACK_PRICE_EUR.max} €</strong> ·
        séparé des agents prévisionnels GreenSmoke.
      </p>
      <label className="block text-xs text-gray-500">
        Prompt
        <textarea
          className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm min-h-[80px]"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ex. Micro-arb xExchange vs OneDex…"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs text-gray-500">
          Nom (opt.)
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>
        <label className="block text-xs text-gray-500">
          Prix € ({PACK_PRICE_EUR.min}–{PACK_PRICE_EUR.max})
          <input
            type="number"
            min={PACK_PRICE_EUR.min}
            max={PACK_PRICE_EUR.max}
            step={1}
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={priceEur}
            onChange={e => setPriceEur(e.target.value)}
          />
        </label>
      </div>
      <button type="submit" className="btn-primary text-sm w-full sm:w-auto">
        Enregistrer l’intent
      </button>
      {msg && <p className="text-xs text-amber-200/90 leading-relaxed">{msg}</p>}
    </form>
  )
}
