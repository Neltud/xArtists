import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Checklist services / SC gates — paper by default.
 * Commercial packs GO is gated by smoke PayBox + My Packs (not this page alone).
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
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{xaRender('Services · gates')}</p>
        <h1 className="text-2xl font-semibold text-white">{xaRender('État des services')}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {xaRender('Checklist mainnet — gates = CODEHASH_OK build')}{' '}
          <span className="text-zinc-500">AND</span>{' '}
          {xaRender('observation runtime. Posture produit : paper (LIA live = 0).')}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          mode={asText(mode)} · envLiveCapable={String(envLive)} · marketPayable=
          {String(marketPayable)} · listings={listings.length}
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-3 py-2.5 text-[12px] leading-relaxed text-amber-50/90">
        <span className="font-semibold text-amber-100">{xaRender('NO-GO commercial packs')}</span>
        <span className="text-amber-100/70"> — </span>
        {xaRender(
          'Annonce packs / LIA réel uniquement après smoke PayBox (S1) + preuve My Packs NFT (S2). Les pastilles SC ci-dessous ne remplacent pas ce gate.',
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <Link to="/intelligence/agents" className="underline text-amber-50 font-medium">
            {xaRender('Packs')}
          </Link>
          <span className="text-amber-100/40">·</span>
          <Link to="/workspace/agents" className="underline text-amber-50 font-medium">
            {xaRender('My Packs')}
          </Link>
          <span className="text-amber-100/40">·</span>
          <a
            className="underline text-amber-50 font-medium"
            href="https://github.com/Neltud/xArtists/blob/main/docs/SMOKE_PAYBOX_P0.md"
            target="_blank"
            rel="noreferrer"
          >
            {xaRender('Runbook smoke')}
          </a>
        </div>
      </div>

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
    </div>
  )
}
