/**
 * Checklist GO_LIVE mainnet + Real Capital Engaged.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RceStrip from '../components/RceStrip'
import { AGENT_8008 } from '../config/agent8008'
import { PACK_PRICE_EGLD } from '../config/multichain'
import DustTestPanel from '../components/DustTestPanel'
import { getEnvLiveCapable, getAppMode } from '../lib/appMode'
import {
  refreshRuntimeCodehashes,
  runtimeCodehashOk,
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

function envFlag(name: string): boolean {
  try {
    const v = String((import.meta as { env?: Record<string, string> }).env?.[name] || '').toLowerCase()
    return v === 'true' || v === '1'
  } catch {
    return false
  }
}

function gate(envName: string, key: Parameters<typeof runtimeCodehashOk>[0]): boolean {
  return envFlag(envName) || runtimeCodehashOk(key)
}

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

  const marketOk = canListBuyNft() || gate('VITE_MARKETPLACE_CODEHASH_OK', 'marketplace')
  const troOk = canStakeTro() || gate('VITE_TRO_STAKING_CODEHASH_OK', 'tro_staking')
  const venueOk = canUseVenue() || gate('VITE_VENUE_CODEHASH_OK', 'venue')
  const treasuryOk = canUseTreasury() || gate('VITE_TREASURY_CODEHASH_OK', 'treasury')
  const agentsOk = canBuyAgent() || gate('VITE_AGENTS_CODEHASH_OK', 'agents')
  const slotOk = canSpinSlot() || runtimeCodehashOk('slot')
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
      label: 'Treasury',
      ok: treasuryOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.treasury_splitter}`,
    },
    {
      id: 'agents',
      label: 'Agents mint / buy',
      ok: agentsOk,
      note: agentsOk ? undefined : 'mint pack SC pas prêt',
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.agents_marketplace}`,
    },
    {
      id: 'slot',
      label: 'Slot casino',
      ok: slotOk,
      note:
        slotPayable === false
          ? 'isPayable=false — EGLD rejeté, spin REAL fermé'
          : house != null
            ? `house ~${asText(typeof house === 'number' ? house.toFixed(4) : house)} EGLD`
            : undefined,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.slot_casino}`,
    },
  ]

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto pb-16">
      <header className="space-y-2">
        <p className="section-label">Mainnet</p>
        <h1 className="section-title display">Status & capital</h1>
        <p className="text-sm text-zinc-400">
          Mode app : <strong className="text-zinc-200">{asText(mode)}</strong>
          {envLive ? ' · env live capable' : ''} · floor pack {formatRCE(PACK_PRICE_EGLD)}
        </p>
      </header>

      <RceStrip />

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Gates SC</h2>
        <ul className="space-y-2">
          {scItems.map(it => (
            <li
              key={it.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-[13px]"
            >
              <div>
                <p className="text-zinc-200">{asText(it.label)}</p>
                {it.note && <p className="text-[11px] text-zinc-500">{asText(it.note)}</p>}
                {it.href && (
                  <a
                    className="text-[11px] text-cyan-400 underline"
                    href={it.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explorer
                  </a>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  it.ok
                    ? 'border-emerald-500/40 text-emerald-300'
                    : 'border-amber-500/35 text-amber-200'
                }`}
              >
                {it.ok ? 'OK' : 'ATTENTE'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <DustTestPanel />

      <section className="card space-y-2">
        <h2 className="text-sm font-semibold text-white">Preuves live</h2>
        <p className="text-[12px] text-zinc-400">
          Market payable :{' '}
          <strong className="text-zinc-200">
            {marketPayable == null ? '…' : marketPayable ? 'oui' : 'non'}
          </strong>
          . Slot payable :{' '}
          <strong className="text-zinc-200">
            {slotPayable == null ? '…' : slotPayable ? 'oui' : 'non'}
          </strong>
          . Treasury dest toujours null — ne pas router les frais.
        </p>
        {listings.length > 0 && (
          <ul className="space-y-1 text-[12px] text-zinc-300">
            {listings.map(l => (
              <li key={l.id}>
                Listing #{l.id} {l.token}-{String(l.nonce).padStart(2, '0')} · {l.priceEgld} EGLD ·{' '}
                {l.active ? 'actif' : 'inactif'}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-sm font-semibold text-white">Spin réel</h2>
        <p className="text-[12px] text-zinc-400">
          House 0,5 EGLD. Le compte slot n’est pas payable : un spin EGLD est rejeté par le
          protocole. Fun reste le chemin public. Upgrade du même contrat avec metadata-payable
          seulement — pas un nouveau deploy.
        </p>
      </section>
      <p className="text-[11px] text-zinc-600">
        Agent 8008 : {asText(AGENT_8008?.id, '—')} ·{' '}
        <Link to="/" className="text-cyan-400 underline">
          Accueil
        </Link>
        {' · '}
        <Link to="/lia" className="text-cyan-400 underline">
          LIA Hub
        </Link>
      </p>
    </div>
  )
}
