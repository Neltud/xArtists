/** Venue-split — rentPay dust if live, sinon paper journal. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useVenueRentTx } from '../hooks/useVenueRentTx'
import { requestOpenConnect } from '../lib/walletEvents'
import { useToast } from '../components/ui/Toast'

const TIERS = [
  { id: 'wall-1', label: 'Mur 1 œuvre', egld: 0.05 },
  { id: 'wall-4', label: 'Mur 4 œuvres', egld: 0.15 },
  { id: 'room', label: 'Salle complète', egld: 0.4 },
]

export default function VenuePage() {
  const { connected, canAttemptSign } = useWallet()
  const { live, pending, error, lastTx, rentPay, venueAddress } = useVenueRentTx()
  const { push } = useToast()
  const [tier, setTier] = useState(TIERS[0].id)

  const selected = TIERS.find(t => t.id === tier) || TIERS[0]

  const onPay = async () => {
    if (!connected) {
      requestOpenConnect()
      return
    }
    if (!canAttemptSign && live) {
      push('Reconnecte xPortal pour payer on-chain', 'err')
      return
    }
    try {
      await rentPay(selected.id, selected.egld)
      push(live ? 'rentPay envoyé' : 'Journal paper — pas de fonds envoyés', live ? 'ok' : 'info')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Échec', 'err')
    }
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Salles</p>
        <h1 className="section-title display text-2xl">Venue</h1>
        <p className="text-sm text-zinc-400">
          Location de murs musée. Packs IA (1 NFT = 1 salle) restent sur My Packs.
        </p>
      </header>

      <div className="card space-y-3">
        <p className="text-[12px] text-zinc-500">
          {live ? 'Paiement on-chain disponible' : 'Mode paper — aucun EGLD envoyé'}
        </p>
        <div className="grid gap-2">
          {TIERS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTier(t.id)}
              className={`text-left rounded-xl border px-3 py-2 ${
                tier === t.id ? 'border-violet-400/40 bg-violet-500/10' : 'border-white/10'
              }`}
            >
              <span className="text-sm text-white">{t.label}</span>
              <span className="block text-[12px] text-zinc-500 tabular-nums">{t.egld} EGLD</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary text-sm" disabled={pending} onClick={() => void onPay()}>
          {pending ? 'Signature…' : live ? `Payer ${selected.egld} EGLD` : 'Simuler (paper)'}
        </button>
        {error && <p className="text-[12px] text-amber-200/90">{error}</p>}
        {lastTx && lastTx !== 'wallet-hook' && (
          <a
            className="text-[11px] text-cyan-400 underline"
            href={`https://explorer.multiversx.com/transactions/${lastTx}`}
            target="_blank"
            rel="noreferrer"
          >
            Explorer →
          </a>
        )}
      </div>

      <Link to="/my-packs" className="btn-secondary text-sm inline-block">
        Mes salles pack
      </Link>
    </div>
  )
}
