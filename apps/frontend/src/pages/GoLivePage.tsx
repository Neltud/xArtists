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
import { asText } from '../lib/safeRender'

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
  const mode = getAppMode()
  const envLive = getEnvLiveCapable()

  useEffect(() => {
    void refreshRuntimeCodehashes().then(() => setTick(x => x + 1))
  }, [])

  const marketOk = canListBuyNft() || gate('VITE_MARKETPLACE_CODEHASH_OK', 'marketplace')
  const troOk = canStakeTro() || gate('VITE_TRO_STAKING_CODEHASH_OK', 'tro_staking')
  const venueOk = canUseVenue() || gate('VITE_VENUE_CODEHASH_OK', 'venue')
  const treasuryOk = canUseTreasury() || gate('VITE_TREASURY_CODEHASH_OK', 'treasury')
  const agentsOk = canBuyAgent() || gate('VITE_AGENTS_CODEHASH_OK', 'agents')
  const slotOk = canSpinSlot() || runtimeCodehashOk('slot')
  const house = runtimeSlotBalance()

  const packFloor =
    typeof PACK_PRICE_EGLD === 'object' && PACK_PRICE_EGLD && 'min' in PACK_PRICE_EGLD
      ? Number((PACK_PRICE_EGLD as { min: number }).min)
      : Number(PACK_PRICE_EGLD) || 10

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
        house != null
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
          {envLive ? ' · env live capable' : ''} · floor pack {asText(packFloor)} EGLD
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
        <h2 className="text-sm font-semibold text-white">Spin réel</h2>
        <p className="text-[12px] text-zinc-400">
          House financée. Le spin FUN reste le chemin public. Le spin REAL reste fermé tant que le
          fail spinEgld n&apos;est pas diagnostiqué et rejoué en micro-preuve. Ce n&apos;est pas un
          casino ouvert.
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
