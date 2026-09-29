/**
 * Corps 3D-lite — objets = SC mainnet.
 * Clic → prepare path wallet (xPortal / TxShell) selon objet.
 * Lecture état via chainMirror (RPC → store).
 */
import { Link } from 'react-router-dom'
import { useChainMirror } from '../hooks/useChainMirror'
import { canStakeTro, canListBuyNft, canSpinSlot, canRentVenueOnChain } from '../config/scStatus'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'

const ACTION: Record<
  string,
  { href: string; cta: string; gated: () => boolean }
> = {
  tro_staking: { href: '/staking', cta: 'Stake TRO', gated: canStakeTro },
  marketplace: { href: '/market', cta: 'Market', gated: canListBuyNft },
  venue: { href: '/venues', cta: 'Venue', gated: canRentVenueOnChain },
  slot: { href: '/slot', cta: 'Slot', gated: canSpinSlot },
}

export default function ChainObjectCanvas() {
  const snap = useChainMirror()
  const { connected } = useWallet()

  return (
    <section className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-semibold">
            Mainnet · objets on-chain
          </p>
          <p className="text-[12px] text-zinc-500">
            RPC → store → couleur · clic → xPortal / page SC
          </p>
        </div>
        <span className="text-[10px] mono text-zinc-600">
          stake {snap.troTotalStaked} atomic · {snap.apiOk ? 'api ok' : 'api?'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {snap.objects.map(o => {
          const act = ACTION[o.key]
          const hue = o.live ? 160 - o.intensity * 40 : 0
          const sat = o.live ? 70 : 10
          const light = o.live ? 35 + o.intensity * 25 : 18
          return (
            <div key={o.key} className="space-y-2">
              <button
                type="button"
                className="w-full aspect-square rounded-2xl border border-white/10 relative overflow-hidden group transition transform hover:scale-[1.02]"
                style={{
                  background: `radial-gradient(circle at 40% 30%, hsl(${hue} ${sat}% ${light + 15}%), hsl(${hue} ${sat}% ${light}%))`,
                  boxShadow: o.live
                    ? `0 0 ${20 + o.intensity * 40}px hsla(${hue}, 80%, 50%, ${0.2 + o.intensity * 0.4})`
                    : 'none',
                }}
                title={o.address}
                onClick={() => {
                  if (!connected) {
                    requestOpenConnect()
                    return
                  }
                  if (act) window.location.hash = '' // stay SPA
                }}
              >
                <span className="absolute inset-0 flex flex-col items-center justify-center text-white/90">
                  <span className="text-lg font-semibold">{o.label}</span>
                  <span className="text-[10px] mt-1 opacity-80">
                    {o.live ? 'LIVE' : '—'} · {o.balanceEgld.toFixed(3)} EGLD
                  </span>
                </span>
              </button>
              {act && (
                <Link
                  to={act.href}
                  className={`block text-center text-[11px] rounded-lg py-1.5 border ${
                    act.gated()
                      ? 'border-emerald-500/30 text-emerald-200 bg-emerald-500/10'
                      : 'border-white/10 text-zinc-500'
                  }`}
                >
                  {act.cta} {act.gated() ? '→' : '(gate)'}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {snap.objects.length === 0 && (
        <p className="text-[12px] text-zinc-600 text-center py-6">Chargement miroir chaîne…</p>
      )}

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Clic objet : connecte xPortal si besoin, puis ouvre la page SC. Signature user uniquement —
        aucune clé dans le navigateur.
      </p>
    </section>
  )
}
