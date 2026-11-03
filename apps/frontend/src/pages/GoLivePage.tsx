import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Checklist GO_LIVE mainnet + Real Capital Engaged.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RceStrip from '../components/RceStrip'
import { AGENT_8008 } from '../config/agent8008'
import { PACK_PRICE_EGLD } from '../config/multichain'
import DustTestPanel from '../components/DustTestPanel'
import ProtocolPulsePanel from '../components/ProtocolPulsePanel'
import { getEnvLiveCapable, getAppMode } from '../lib/appMode'
import {
  refreshRuntimeCodehashes,
  runtimeSlotBalance,
} from '../lib/runtimeCodehash'
import { MAINNET_ADDRESSES } from '../config/contracts'
import {
  canListBuyNft,
  canSpinSlot,
  canStakeTro,
  canUseVenue,
  canUseTreasury,
  canBuyAgent,
} from '../config/scStatus'
import { asText, formatRCE } from '../lib/safeRender'
import { fetchMarketPayable } from '../lib/marketPayable'
import { fetchOnChainMarketListings, type OnChainListing } from '../lib/marketChain'

type Item = { id: string; label: string; ok: boolean; note?: string; href?: string }

export default function GoLivePage() {
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [, setTick] = useState(0)
  const [listings, setListings] = useState<OnChainListing[]>([])
  const [slotPayable, setSlotPayable] = useState<boolean | null>(null)
  const [marketPayable, setMarketPayable] = useState<boolean | null>(null)
  const mode = getAppMode()
  const envLive = getEnvLiveCapable()

  useEffect(() => {
    void refreshRuntimeCodehashes().then(() => setTick(x => x + 1))
    const market = MAINNET_ADDRESSES.nft_marketplace
    const slot = MAINNET_ADDRESSES.slot_casino
    if (market) {
      void fetchOnChainMarketListings(market).then(setListings).catch(() => setListings([]))
      void fetchMarketPayable(market).then(s => setMarketPayable(s.isPayable))
    }
    if (slot) void fetchMarketPayable(slot).then(s => setSlotPayable(s.isPayable))
  }, [])

  // AND gates only: build CODEHASH_OK + fresh runtime — no env OR bypass
  const marketOk = canListBuyNft()
  const troOk = canStakeTro()
  const venueOk = canUseVenue()
  const treasuryOk = canUseTreasury()
  const agentsOk = canBuyAgent()
  const slotOk = canSpinSlot()
  const house = runtimeSlotBalance()

  const scItems: Item[] = [
    {
      id: 'market',
      label: 'Marketplace list / buy',
      ok: marketOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.nft_marketplace}`,
    },
    {
      id: 'tro',
      label: 'TRO staking',
      ok: troOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.tro_staking}`,
    },
    {
      id: 'venue',
      label: 'Venue rentPay',
      ok: venueOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.venue_split}`,
    },
    {
      id: 'treasury',
      label: 'Treasury splitter',
      ok: treasuryOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.treasury_splitter}`,
    },
    {
      id: 'agents',
      label: 'Agents marketplace',
      ok: agentsOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.agents_marketplace}`,
    },
    {
      id: 'slot',
      label: 'Slot casino',
      ok: slotOk && slotPayable !== false,
      note:
        slotPayable === false
          ? 'isPayable=false (transferts directs rejetés) — endpoints SC distincts'
          : house
            ? `bal ${house.toFixed(4)} EGLD`
            : undefined,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.slot_casino}`,
    },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-3">
        <p className="section-label">État public · xArtists</p>
        <h1 className="text-2xl font-semibold text-white">Disponibilité des services</h1>
        <p className="max-w-2xl text-sm leading-7 text-zinc-300">
          Les œuvres et modules de xArtists se visitent librement. Le checkout, les
          enchères réelles, la livraison NFT automatisée, le bridge Solana et le
          trading autonome ne sont pas ouverts au public.
        </p>
        <p role="status" className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          Mode découverte et démonstration uniquement. Un contrat présent sur la
          blockchain ou un solde de trésorerie ne signifie pas qu’un service
          marchand est homologué ni que les fonds des visiteurs sont acceptés.
        </p>
        <nav aria-label="Parcours publics" className="flex flex-wrap gap-3">
          <Link className="btn-secondary inline-flex min-h-[44px] items-center px-4 text-sm" to="/marketplace">Marketplace</Link>
          <Link className="btn-secondary inline-flex min-h-[44px] items-center px-4 text-sm" to="/studio">Studio</Link>
          <Link className="btn-secondary inline-flex min-h-[44px] items-center px-4 text-sm" to="/lia">LIA · Paper</Link>
        </nav>
      </header>
      <button type="button" onClick={() => setShowDiagnostics(v => !v)} aria-expanded={showDiagnostics}
        aria-controls="xa-operator-diagnostics"
        className="btn-secondary inline-flex min-h-[44px] items-center px-4 text-sm">
        {showDiagnostics ? 'Masquer les diagnostics techniques' : 'Afficher les diagnostics techniques (lecture seule)'}
      </button>
      {showDiagnostics && <section id="xa-operator-diagnostics" className="space-y-5" aria-label="Diagnostics avancés">
        <p className="text-xs text-zinc-400">
          Diagnostics techniques, non destinés aux transactions :
          mode={asText(mode)} · envLiveCapable={String(envLive)} · marketPayable=
          {String(marketPayable)} · listings={listings.length}
        </p>
        <RceStrip />
      <ul className="space-y-2">
        {scItems.map(it => (
          <li
            key={it.id}
            className={`rounded-lg border px-3 py-2 text-sm ${
              it.ok ? 'border-emerald-800/60 bg-emerald-950/30' : 'border-zinc-800 bg-zinc-900/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={it.ok ? 'text-emerald-300' : 'text-zinc-400'}>{it.label}</span>
              <span className="text-xs">{it.ok ? 'OK' : 'CLOSED'}</span>
            </div>
            {it.note ? <p className="mt-1 text-[11px] text-zinc-500">{it.note}</p> : null}
            {it.href ? (
              <a className="mt-1 inline-block text-[11px] text-sky-400" href={it.href} target="_blank" rel="noreferrer">
                explorer
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <ProtocolPulsePanel />
      <DustTestPanel />
      <div className="text-xs text-zinc-600">
        <Link to="/" className="text-sky-500">
          {xaRender('← Accueil')}
        </Link>
        {' · '}
        packs={formatRCE(PACK_PRICE_EGLD)} · agent={AGENT_8008?.id || '—'}
      </div>
      </section>}
    </div>
  )
}
