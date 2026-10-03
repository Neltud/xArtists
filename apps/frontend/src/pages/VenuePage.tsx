/** Venue-split — rentPay on-chain si live ; sinon réservation locale (pas un achat). */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useVenueRentTx } from '../hooks/useVenueRentTx'
import { requestOpenConnect } from '../lib/walletEvents'
import { useToast } from '../components/ui/Toast'
import { markWallOwned } from '../lib/venueWallSlots'

const TIERS = [
  { id: 'wall-1', label: 'Mur 1 œuvre', egld: 0.05 },
  { id: 'wall-4', label: 'Mur 4 œuvres', egld: 0.15 },
  { id: 'room', label: 'Salle complète', egld: 0.4 },
]

export default function VenuePage() {
  const { connected, canAttemptSign } = useWallet()
  const venue = useVenueRentTx()
  const live = Boolean(venue.live)
  const pending = Boolean(venue.pending)
  const error = venue.error
  const lastTx = venue.lastTx
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
      if (live && typeof venue.rentPayLive === 'function') {
        await venue.rentPayLive(selected.id, selected.egld)
        markWallOwned(selected.id, { mode: 'live', amountEgld: selected.egld })
        push('rentPay envoyé on-chain', 'ok')
      } else if (typeof venue.rentPay === 'function') {
        await venue.rentPay(selected.id, selected.egld)
        markWallOwned(selected.id, { mode: live ? 'live' : 'paper', amountEgld: selected.egld })
        push(live ? 'rentPay envoyé' : 'Réservation locale — aucun EGLD envoyé', live ? 'ok' : 'info')
      } else if (typeof venue.rentPayPaper === 'function') {
        venue.rentPayPaper(selected.id, selected.egld)
        markWallOwned(selected.id, { mode: 'paper', amountEgld: selected.egld })
        push('Réservation locale — aucun EGLD envoyé', 'info')
      } else {
        throw new Error('Venue TX indisponible')
      }
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
          Location de murs musée. Les packs IA (1 salle privée) restent dans Mes salles.
        </p>
      </header>

      <div className="card space-y-3">
        <p className="text-[12px] text-zinc-500">
          {live
            ? 'Paiement on-chain disponible'
            : 'On-chain bientôt — tu peux réserver localement (sans EGLD) pour tester l’accrochage NFT au musée.'}
        </p>
        <div className="grid gap-2">
          {TIERS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTier(t.id)}
              className={`text-left rounded-xl border px-3 py-2 active:scale-[0.99] ${
                tier === t.id ? 'border-violet-400/40 bg-violet-500/10' : 'border-white/10'
              }`}
            >
              <span className="text-sm text-white">{t.label}</span>
              <span className="block text-[12px] text-zinc-500 tabular-nums">{t.egld} EGLD</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn-primary text-sm active:scale-[0.98]"
          disabled={pending}
          onClick={() => void onPay()}
        >
          {pending
            ? 'Signature…'
            : live
              ? `Payer ${selected.egld} EGLD`
              : 'Réserver sans paiement (local)'}
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

      <div className="flex flex-wrap gap-2">
        <Link to="/museum" className="btn-secondary text-sm">
          Musée · accrocher NFT
        </Link>
        <Link to="/my-packs" className="btn-secondary text-sm">
          Mes salles pack
        </Link>
      </div>
    </div>
  )
}
