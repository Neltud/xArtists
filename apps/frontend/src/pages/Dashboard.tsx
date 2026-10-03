/**
 * Home — badges LIVE si preuve explorer ; sinon BIENTÔT / OUVERT.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'
import {
  CORE_MODULES,
  SECONDARY_MODULES,
  STATUS_CLASS,
  STATUS_LABEL,
  type ProductModule,
} from '../config/product'
import { isLiveProven, refreshExplorerProofs, type ProofKey } from '../lib/explorerProof'
import { MAINNET_ADDRESSES } from '../config/contracts'

function mapProof(id: string): ProofKey | null {
  if (id === 'marketplace') return 'marketplace'
  if (id === 'slot') return 'slot'
  if (id === 'staking') return 'tro_staking'
  if (id === 'agents') return 'agents'
  return null
}

function badgeStatus(m: ProductModule): ProductModule['status'] {
  const pk = mapProof(m.id)
  if (!pk) return m.status
  if (isLiveProven(pk)) return 'live'
  // SC déclaré live mais pas encore de preuve TX → BIENTÔT (pas de jargon interne)
  if (m.status === 'live') return 'soon'
  return m.status
}

export default function Dashboard() {
  const { connected } = useWallet()
  const { t } = useI18n()
  const [, setTick] = useState(0)

  useEffect(() => {
    void refreshExplorerProofs().then(() => setTick(x => x + 1))
    const on = () => setTick(x => x + 1)
    window.addEventListener('xartists-proof', on)
    window.addEventListener('xartists-codehash', on)
    return () => {
      window.removeEventListener('xartists-proof', on)
      window.removeEventListener('xartists-codehash', on)
    }
  }, [])

  const core = CORE_MODULES.filter(m => m.id !== 'home')

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/50 via-[#0a0a12] to-cyan-950/40 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative max-w-xl space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/85">
            xArtists · MultiversX mainnet
          </p>
          <h1 className="font-tech text-3xl font-bold tracking-tight text-white title-glow sm:text-4xl">
            NFT · $TRO · Packs
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            LIVE = utilisable on-chain. BIENTÔT = en cours d&apos;ouverture. OUVERT = interface prête.
            Pas un fond d&apos;investissement.
          </p>
          <div className="flex flex-wrap gap-2">
            {!connected && (
              <button type="button" className="btn-primary active:scale-[0.98]" onClick={() => requestOpenConnect()}>
                {t('common.connect')}
              </button>
            )}
            <Link to="/marketplace" className="btn-secondary active:scale-[0.98]">
              Marketplace
            </Link>
            <Link to="/museum" className="btn-secondary active:scale-[0.98]">
              Musée
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <p className="section-label">Produit cœur</p>
          <p className="text-[10px] text-zinc-600">Clique une carte pour ouvrir</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {core.map(m => {
            const st = badgeStatus(m)
            return (
              <Link
                key={m.id}
                to={m.path}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-400/30 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-white">
                    <span className="mr-1.5" aria-hidden>
                      {m.emoji}
                    </span>
                    {m.label}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${STATUS_CLASS[st]}`}
                  >
                    {STATUS_LABEL[st]}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] text-zinc-500">{m.blurb}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <p className="section-label">Aussi</p>
        <div className="flex flex-wrap gap-2">
          {SECONDARY_MODULES.map(m => (
            <Link
              key={m.id}
              to={m.path}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[12px] text-zinc-300 transition hover:border-white/20 hover:text-white active:scale-95"
            >
              {m.emoji} {m.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4 text-[11px] text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-300">Contrats mainnet</p>
        <p className="mono truncate">market {MAINNET_ADDRESSES.nft_marketplace}</p>
        <p className="mono truncate">stake {MAINNET_ADDRESSES.tro_staking}</p>
        <p className="mono truncate">slot {MAINNET_ADDRESSES.slot_casino}</p>
      </section>
    </div>
  )
}
