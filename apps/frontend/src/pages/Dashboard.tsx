/**
 * Home produit — core modules + honnêteté SC.
 */
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'
import {
  CORE_MODULES,
  SECONDARY_MODULES,
  STATUS_CLASS,
  STATUS_LABEL,
} from '../config/product'
import {
  canListBuyNft,
  canSpinSlot,
  canStakeTro,
  canBuyAgent,
  canRentVenueOnChain,
} from '../config/scStatus'
import { MAINNET_ADDRESSES } from '../config/contracts'

function resolveLive(id: string, fallback: string): string {
  if (id === 'marketplace' && canListBuyNft()) return 'live'
  if (id === 'slot' && canSpinSlot()) return 'live'
  if (id === 'staking' && canStakeTro()) return 'live'
  if (id === 'agents' && canBuyAgent()) return 'live'
  if (id === 'venues' && canRentVenueOnChain()) return 'live'
  return fallback
}

export default function Dashboard() {
  const { connected } = useWallet()
  const { t } = useI18n()

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
            Marketplace on-chain prouvée. Staking, slot et packs selon gates SC.
            Pas un fond d&apos;investissement. Pas de promesse de rendement.
          </p>
          <div className="flex flex-wrap gap-2">
            {!connected && (
              <button type="button" className="btn-primary" onClick={() => requestOpenConnect()}>
                {t('common.connect')}
              </button>
            )}
            <Link to="/marketplace" className="btn-secondary">
              Marketplace
            </Link>
            <Link to="/staking" className="btn-secondary">
              Staking
            </Link>
            <Link to="/go-live" className="btn-secondary">
              Status SC
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <p className="section-label">Produit cœur</p>
          <p className="text-[10px] text-zinc-600">LIVE = TX possible · PAPER = UI</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {core.map(m => {
            const st = resolveLive(m.id, m.status) as keyof typeof STATUS_LABEL
            return (
              <Link
                key={m.id}
                to={m.path}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-400/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-white">
                    <span className="mr-1.5" aria-hidden>
                      {m.emoji}
                    </span>
                    {m.label}
                  </h2>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${STATUS_CLASS[st]}`}>
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
        <p className="section-label">Secondaire</p>
        <div className="flex flex-wrap gap-2">
          {SECONDARY_MODULES.map(m => (
            <Link
              key={m.id}
              to={m.path}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[12px] text-zinc-300 hover:border-white/20 hover:text-white"
            >
              {m.emoji} {m.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4 text-[11px] text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-300">SC mainnet (adresses)</p>
        <p className="mono truncate">market {MAINNET_ADDRESSES.nft_marketplace}</p>
        <p className="mono truncate">stake {MAINNET_ADDRESSES.tro_staking}</p>
        <p className="mono truncate">slot {MAINNET_ADDRESSES.slot_casino}</p>
        <p className="mono truncate">agents {MAINNET_ADDRESSES.agents_marketplace}</p>
      </section>
    </div>
  )
}
