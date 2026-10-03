/**
 * Louer un mur (rentPay live ou réservation locale) puis accrocher jusqu'à N NFT.
 */
import { useCallback, useMemo, useState } from 'react'
import { useWallet } from '../../context/WalletContext'
import { useUserAccount } from '../../hooks/useUserAccount'
import { useVenueRentTx } from '../../hooks/useVenueRentTx'
import { requestOpenConnect } from '../../lib/walletEvents'
import { isVenueLive } from '../../lib/scStatus'
import {
  VENUE_WALL_CATALOG,
  getWallSlots,
  isWallOwned,
  markWallOwned,
  maxSlotsPerWall,
  toggleNftOnWall,
  wallLabel,
  loadOwnedWalls,
} from '../../lib/venueWallSlots'
import { nftImageUrl, type NFT } from '../../types/nft'
import { useToast } from '../ui/Toast'
import { canListBuyNft } from '../../config/scStatus'

export default function VenueWallAssign({ onChanged }: { onChanged?: () => void }) {
  const { connected, address, canAttemptSign } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const live = isVenueLive()
  const { rentPayLive, rentPayPaper, pending, error } = useVenueRentTx()
  const { push } = useToast()
  const [wallId, setWallId] = useState(VENUE_WALL_CATALOG[0]?.wallId || 'wall-1')
  const [tick, setTick] = useState(0)

  const owned = useMemo(() => loadOwnedWalls(), [tick])
  const wallOwned = isWallOwned(wallId)
  const slots = getWallSlots(wallId)
  const max = maxSlotsPerWall()
  const catalog = VENUE_WALL_CATALOG.find(w => w.wallId === wallId)

  const nfts = useMemo(() => {
    return (account.nfts || []).filter((n: NFT) => n?.identifier).slice(0, 48)
  }, [account.nfts])

  const refresh = useCallback(() => {
    setTick(x => x + 1)
    onChanged?.()
  }, [onChanged])

  const onRent = async () => {
    if (!connected) {
      requestOpenConnect()
      return
    }
    const price = catalog?.priceEgld ?? 0.001
    try {
      if (live && canAttemptSign) {
        const res = await rentPayLive(wallId, price)
        const hash =
          (res as { sessionId?: string })?.sessionId ||
          (res as { transactions?: { hash?: string }[] })?.transactions?.[0]?.hash
        markWallOwned(wallId, { mode: 'live', amountEgld: price, txHash: hash || undefined })
        push(`Mur ${wallLabel(wallId)} loué on-chain`, 'ok')
      } else {
        rentPayPaper(wallId, price)
        markWallOwned(wallId, { mode: 'paper', amountEgld: price })
        push(`Mur ${wallLabel(wallId)} réservé localement (0 EGLD) — assigne tes NFT`, 'info')
      }
      refresh()
    } catch (e) {
      push(e instanceof Error ? e.message : 'rentPay échoué', 'err')
    }
  }

  const onToggle = (id: string) => {
    if (!wallOwned) {
      push('Réserve ou loue ce mur d’abord', 'err')
      return
    }
    toggleNftOnWall(wallId, id)
    refresh()
  }

  return (
    <section className="card space-y-4">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-cyan-400/80 font-semibold">
          Venue · murs
        </p>
        <h2 className="text-lg font-semibold text-white">Louer un mur & accrocher des NFT</h2>
        <p className="text-[13px] text-zinc-400">
          1. Loue (EGLD) ou réserve localement · 2. jusqu’à {max} NFT · 3. priorité dans le hall 3D.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {VENUE_WALL_CATALOG.map(w => {
          const on = owned.some(o => o.wallId === w.wallId)
          return (
            <button
              key={w.wallId}
              type="button"
              onClick={() => setWallId(w.wallId)}
              className={`rounded-full px-3 py-1.5 text-[12px] border active:scale-[0.98] ${
                wallId === w.wallId
                  ? 'border-cyan-400/50 bg-cyan-500/15 text-white'
                  : 'border-white/10 text-zinc-400'
              }`}
            >
              {w.label}
              {on ? ' · ✓' : ''}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[12px] text-zinc-400">
        <p>
          <strong className="text-zinc-200">{wallLabel(wallId)}</strong> ·{' '}
          <span className="mono">{wallId}</span>
        </p>
        <p className="mt-0.5">{catalog?.museumHint}</p>
        <p className="mt-1">
          Statut :{' '}
          {wallOwned ? (
            <span className="text-emerald-300">
              {owned.find(o => o.wallId === wallId)?.mode === 'live' ? 'loué on-chain' : 'réservé local'}
            </span>
          ) : (
            <span className="text-amber-200">libre</span>
          )}{' '}
          · slots {slots.length}/{max}
        </p>
        {!live && (
          <p className="text-amber-200/80 mt-1">
            SC venue non ouvert au public → réservation locale possible (pas un paiement).
          </p>
        )}
      </div>

      {!wallOwned ? (
        <button
          type="button"
          className="btn-primary text-sm active:scale-[0.98]"
          disabled={pending}
          onClick={() => void onRent()}
        >
          {pending
            ? '…'
            : live
              ? `Louer · ${catalog?.priceEgld ?? 0.001} EGLD`
              : 'Réserver sans paiement (local)'}
        </button>
      ) : (
        <p className="text-[12px] text-emerald-200/90">Mur actif — coche les NFT à exposer.</p>
      )}

      {error && <p className="text-[12px] text-red-400">{error}</p>}

      {!connected ? (
        <button type="button" className="btn-secondary text-sm" onClick={requestOpenConnect}>
          Connecter wallet
        </button>
      ) : account.loading ? (
        <p className="text-[12px] text-zinc-500">Chargement NFT…</p>
      ) : nfts.length === 0 ? (
        <p className="text-[12px] text-zinc-500">
          Aucun NFT dans le wallet.{' '}
          {canListBuyNft() && (
            <a href="#/marketplace" className="text-cyan-400 underline">
              Marketplace
            </a>
          )}
        </p>
      ) : (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {nfts.map((n: NFT) => {
            const id = n.identifier as string
            const on = slots.includes(id)
            const thumb = nftImageUrl(n)
            return (
              <li key={id}>
                <button
                  type="button"
                  disabled={!wallOwned}
                  onClick={() => onToggle(id)}
                  className={`w-full text-left rounded-xl border p-1.5 disabled:opacity-40 active:scale-[0.98] ${
                    on ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10'
                  }`}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="w-full aspect-square object-cover rounded-lg bg-zinc-900"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-zinc-900" />
                  )}
                  <p className="text-[10px] text-zinc-300 truncate mt-1">{n.name || id}</p>
                  {on && <p className="text-[9px] text-cyan-300">Sur le mur</p>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
