/**
 * Checkout packs — Stripe + Paybox + paper.
 * Paper success = mark owned + optional theater callback.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useWallet } from '../context/WalletContext'
import AccessTermsModal from './AccessTermsModal'
import { canBuyAgent } from '../config/scStatus'
import { markPackOwned } from '../lib/nftPacks'
import {
  availablePayMethods,
  defaultPayMethod,
  payMethodLabel,
  startPackPayment,
  stripeStatusHint,
  payboxStatusHint,
  type PayMethod,
} from '../lib/payments'

const ONLY: PackId[] = ['pulse', 'yield', 'sentinel']
const PACKS = AGENT_PACKS.filter(p => ONLY.includes(p.id)).slice(0, 3)

function savePaperIntent(payload: Record<string, unknown>) {
  try {
    const row = { ...payload, ts: Date.now() }
    localStorage.setItem('xartists_access_checkout_intent', JSON.stringify(row))
    const raw = localStorage.getItem('xartists_access_checkout_log')
    const log = raw ? (JSON.parse(raw) as unknown[]) : []
    const arr = Array.isArray(log) ? log : []
    arr.push(row)
    localStorage.setItem('xartists_access_checkout_log', JSON.stringify(arr.slice(-30)))
  } catch {
    /* ignore */
  }
}

export default function PackCheckout({
  packId: forcedId = null,
  onClear,
  onPaperDone,
}: {
  packId?: PackId | null
  onClear?: () => void
  onPaperDone?: (id: PackId) => void
} = {}) {
  const { connected, address } = useWallet()
  const methods = availablePayMethods()
  const [method, setMethod] = useState<PayMethod>(() => defaultPayMethod())
  const [selected, setSelected] = useState<PackId | null>(
    forcedId && ONLY.includes(forcedId) ? forcedId : null,
  )
  useEffect(() => {
    if (forcedId && ONLY.includes(forcedId)) setSelected(forcedId)
    else if (forcedId === null) setSelected(null)
  }, [forcedId])

  const [termsOpen, setTermsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'terms' | 'redirect' | 'done'>('idle')
  const [msg, setMsg] = useState('')

  const pack = PACKS.find(p => p.id === selected)
  const mintLive = canBuyAgent()

  const startBuy = (id: PackId) => {
    if (!ONLY.includes(id)) return
    if (!connected || !address?.startsWith('erd1')) {
      setMsg('Connecte ton wallet MultiversX (erd1…) avant checkout.')
      setSelected(id)
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
    if (method === 'stripe' || method === 'paybox') {
      setMsg(method === 'stripe' ? 'Ouverture Stripe…' : 'Ouverture Paybox…')
      savePaperIntent({
        packId: pack.id,
        provider: method,
        amount: pack.priceEur.list,
        currency: 'EUR',
        address,
        paper_only: false,
      })
      try {
        await startPackPayment(method, pack.id, address)
      } catch (e) {
        setMsg(String(e))
        setStatus('idle')
      }
      return
    }
    savePaperIntent({
      packId: pack.id,
      provider: 'paper',
      amount: pack.priceEur.list,
      currency: 'EUR',
      address,
      paper_only: true,
      status: 'recorded',
    })
    markPackOwned(pack.id)
    setStatus('done')
    setMsg(`Paper · ${pack.name} enregistré sur cet appareil.`)
    onPaperDone?.(pack.id)
  }

  return (
    <div className="space-y-4">
      {!selected && (
        <div className="flex flex-wrap gap-2">
          {PACKS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => startBuy(p.id)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 hover:bg-white/[0.08]"
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
      )}

      {selected && pack && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            {methods.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-lg px-3 py-1.5 text-xs border ${
                  method === m
                    ? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
                    : 'border-white/10 text-zinc-500'
                }`}
              >
                {payMethodLabel(m)}
              </button>
            ))}
            {onClear && (
              <button type="button" className="text-xs text-zinc-500 underline" onClick={onClear}>
                Changer
              </button>
            )}
          </div>
          <p className="text-[11px] text-zinc-500">
            {method === 'stripe' && stripeStatusHint()}
            {method === 'paybox' && payboxStatusHint()}
            {method === 'paper' &&
              'Paper : intention locale + pack possédé device + ouverture. Mint SC off.'}
          </p>
          {!mintLive && (
            <p className="text-[11px] text-amber-200/80">
              Agents marketplace SC OFF — checkout paper uniquement.
            </p>
          )}
          <button
            type="button"
            onClick={() => startBuy(pack.id)}
            className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 py-2.5 text-sm font-medium text-white"
          >
            {method === 'paper' ? 'Enregistrer' : 'Payer'} {pack.name}
          </button>
          {msg && <p className="text-xs text-zinc-400">{msg}</p>}
          {status === 'done' && (
            <p className="text-xs text-emerald-400/90">
              OK —{' '}
              <Link to="/my-packs" className="underline">
                My Packs
              </Link>
              {' · '}
              <Link to="/payments" className="underline">
                Paiements
              </Link>
            </p>
          )}
        </>
      )}

      <AccessTermsModal
        open={termsOpen}
        packName={pack?.name || 'Pack'}
        priceEur={pack?.priceEur.list || 0}
        onAccept={onAcceptTerms}
        onCancel={() => setTermsOpen(false)}
      />
    </div>
  )
}
