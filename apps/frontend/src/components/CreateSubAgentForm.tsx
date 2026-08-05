import { useState } from 'react'
import { useWallet } from '../context/WalletContext'

/**
 * UX for limited sub-agent NFT packs (not LIA protocol bot, not GreenSmoke).
 * On-chain list requires agents_marketplace deploy.
 */
export default function CreateSubAgentForm() {
  const { connected, address } = useWallet()
  const [prompt, setPrompt] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('0.5')
  const [msg, setMsg] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim().length < 8) {
      setMsg('Prompt trop court (min 8 caractères).')
      return
    }
    // Client-side intent only — Vellum / backend runs subagent_factory
    const intent = {
      action: 'create_subagent',
      prompt: prompt.trim().slice(0, 2000),
      name: name.trim() || undefined,
      price_egld: Number(price) || 0.5,
      creator: connected && address ? address : 'anonymous',
      note: 'Provision via Vellum lia.agents.vellum_provision — SC list after agents_marketplace live',
    }
    try {
      localStorage.setItem('xartists_subagent_intent', JSON.stringify(intent))
    } catch {
      /* ignore */
    }
    setMsg(
      'Intent enregistré localement. Ops/Vellum : python -m lia.agents.vellum_provision avec ce prompt. List on-chain bloqué tant que agents_marketplace = null.'
    )
  }

  return (
    <form onSubmit={onSubmit} className="card border-purple-500/20 space-y-3">
      <h3 className="font-semibold text-sm text-purple-200">Créer un Agent Pack (NFT limité)</h3>
      <p className="text-[11px] text-gray-500">
        Produit <strong>séparé</strong> de LIA protocole et de GreenSmoke. Édition limitée · clé API read-only ·
        stake fonds de départ optionnel (escrow).
      </p>
      <label className="block text-xs text-gray-500">
        Prompt
        <textarea
          className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm min-h-[80px]"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ex. Micro-arb xExchange vs OneDex, signaux seulement…"
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
          Prix EGLD indicatif
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={price}
            onChange={e => setPrice(e.target.value)}
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
