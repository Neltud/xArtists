/**
 * Checklist GO_LIVE mainnet — PUBLIC OPEN 2026-10-01.
 * Gates follow explorer codeHash (runtime) + env flags. LIA trading stays paper.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_8008 } from '../config/agent8008'
import { PACK_PRICE_EGLD } from '../config/multichain'
import DustTestPanel from '../components/DustTestPanel'
import { getEnvLiveCapable, getAppMode } from '../lib/appMode'
import {
  refreshRuntimeCodehashes,
  runtimeCodehashOk,
  runtimeSlotBalance,
  type UnlockKey,
} from '../lib/runtimeCodehash'
import { MAINNET_ADDRESSES } from '../config/contracts'

type Item = { id: string; label: string; ok: boolean; note?: string; href?: string }

function envFlag(name: string): boolean {
  try {
    const v = (import.meta as { env?: Record<string, string> }).env?.[name]
    return v === 'true' || v === '1'
  } catch {
    return false
  }
}

function scOk(envName: string, key: UnlockKey): boolean {
  return envFlag(envName) || runtimeCodehashOk(key)
}

export default function GoLivePage() {
  const [, setTick] = useState(0)
  const pulseApi = Boolean((import.meta as { env?: { VITE_PULSE_API?: string } }).env?.VITE_PULSE_API)
  const liveCapable = getEnvLiveCapable()
  const appMode = getAppMode()
  const vellum = Boolean(
    (import.meta as { env?: { VITE_VELLUM_8008_WEBHOOK?: string } }).env?.VITE_VELLUM_8008_WEBHOOK,
  )

  useEffect(() => {
    let alive = true
    refreshRuntimeCodehashes().then(() => {
      if (alive) setTick(t => t + 1)
    })
    const on = () => setTick(t => t + 1)
    window.addEventListener('xartists-codehash', on)
    return () => {
      alive = false
      window.removeEventListener('xartists-codehash', on)
    }
  }, [])

  const venueOk = scOk('VITE_VENUE_CODEHASH_OK', 'venue')
  const marketOk = scOk('VITE_MARKETPLACE_CODEHASH_OK', 'marketplace')
  const agentsOk = scOk('VITE_AGENTS_CODEHASH_OK', 'agents')
  const troOk = scOk('VITE_TRO_STAKING_CODEHASH_OK', 'tro_staking')
  const slotOk =
    envFlag('VITE_SLOT_CODEHASH_OK') ||
    envFlag('VITE_SLOT_CASINO_CODEHASH_OK') ||
    runtimeCodehashOk('slot')
  const house = runtimeSlotBalance()
  const publicLive = slotOk && house > 0

  const scItems: Item[] = [
    {
      id: 'pem',
      label: 'PEM ops hors git (jamais VITE_*)',
      ok: true,
      note: 'vault local / GitHub Secrets only',
    },
    {
      id: 'venue',
      label: 'venue-split — contrat vérifié on-chain',
      ok: venueOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.venue_split}`,
    },
    {
      id: 'market',
      label: 'NFT marketplace — contrat vérifié on-chain',
      ok: marketOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.nft_marketplace}`,
    },
    {
      id: 'agents',
      label: 'Agents marketplace — contrat vérifié on-chain',
      ok: agentsOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.agents_marketplace}`,
    },
    {
      id: 'tro',
      label: 'TRO staking — contrat vérifié on-chain',
      ok: troOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.tro_staking}`,
    },
    {
      id: 'slot',
      label: 'Slot casino — contrat vérifié on-chain',
      ok: slotOk,
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.slot_casino}`,
    },
    {
      id: 'house',
      label: 'House Slot funded',
      ok: house > 0,
      note: house > 0 ? `${house.toFixed(4)} EGLD · spins ouverts` : 'balance 0 — seed required',
    },
  ]

  const infra: Item[] = [
    {
      id: 'live',
      label: 'Mode app (build)',
      ok: liveCapable || publicLive,
      note: `runtime: ${appMode}`,
    },
    {
      id: 'pulse',
      label: 'pulse-api',
      ok: pulseApi,
      note: pulseApi ? 'injecté au build' : 'démo cycle Pages',
      href: '/#/',
    },
    {
      id: 'vellum',
      label: 'Webhook Vellum (proxy, pas clé)',
      ok: vellum,
      note: vellum ? 'PULSE_HYPE → Vellum' : 'journal local only',
    },
    {
      id: 'xportal',
      label: 'WalletConnect allowlist neltud.github.io',
      ok: true,
      note: 'xPortal users OK',
    },
    {
      id: 'indexer',
      label: 'Indexeur Akash /catalog (optionnel)',
      ok: Boolean((import.meta as { env?: { VITE_CATALOG_API?: string } }).env?.VITE_CATALOG_API),
    },
  ]

  const product: Item[] = [
    {
      id: 'packs',
      label: `Packs Agent IA (${PACK_PRICE_EGLD} EGLD)`,
      ok: agentsOk,
      href: '/#/agents',
    },
    {
      id: '8008',
      label: `MX-8008 ${AGENT_8008.id}`,
      ok: true,
      href: '/#/identity',
    },
    {
      id: 'dust',
      label: 'Dust loop: stake → slot → treasury split',
      ok: troOk && slotOk,
      note: '1 TX user réelle = validation produit',
      href: '/#/staking',
    },
    {
      id: 'lia',
      label: 'LIA live trading',
      ok: false,
      note: 'OFF — paper jusqu’aux micro-proofs + Guardian',
      href: '/#/lia',
    },
  ]

  function render(title: string, items: Item[]) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
        <ul className="space-y-2">
          {items.map(it => (
            <li
              key={it.id}
              className="flex flex-wrap items-start gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[13px]"
            >
              <span className={it.ok ? 'text-emerald-400' : 'text-zinc-500'}>{it.ok ? '✓' : '○'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200">{it.label}</p>
                {it.note && <p className="text-[11px] text-zinc-500">{it.note}</p>}
                {it.href && it.href.startsWith('http') && (
                  <a
                    href={it.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    explorer
                  </a>
                )}
                {it.href && it.href.startsWith('/#') && (
                  <Link to={it.href.replace('/#', '')} className="text-[11px] text-cyan-400 hover:underline">
                    ouvrir
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <div className="animate-fade-in space-y-8 pb-16 max-w-2xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">Mainnet · 1 oct 2026</p>
        {publicLive && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-[13px] text-emerald-100">
            <strong className="font-tech text-emerald-300">PUBLIC GO LIVE</strong>
            {' — '}SC vérifiés on-chain · house {house.toFixed(2)} EGLD · LIA trading paper
          </div>
        )}
        <h1 className="section-title display">GO_LIVE checklist</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          Contrats produit vérifiés par l’explorer (codeHash). Le trading LIA reste paper. Pas un
          fonds d’investissement.
        </p>
      </header>

      <DustTestPanel />
      {render('Smart contracts', scItems)}
      {render('Infra & secrets', infra)}
      {render('Produit', product)}

      <div className="card border border-amber-500/20 bg-amber-500/[0.04] text-[12px] text-zinc-400 space-y-1">
        <p className="text-amber-200/90 font-medium">Règles non négociables</p>
        <p>· PEM hors git / chat / Akash / front</p>
        <p>· Unlock runtime = match explorer, pas un secret commité</p>
        <p>· Safety Switch → paper auto sur échec gas/contract</p>
        <p>· LIA_LIVE_TRADING reste 0 jusqu’aux micro-preuves</p>
        <p>· Tips ≠ investissement · User Connect ≠ LIA Ops</p>
      </div>

      <p className="text-[12px] text-zinc-600">
        <Link to="/lia" className="text-cyan-400 hover:underline">
          LIA
        </Link>
        {' · '}
        <Link to="/studio" className="text-cyan-400 hover:underline">
          Studio
        </Link>
        {' · '}
        <Link to="/staking" className="text-cyan-400 hover:underline">
          Staking
        </Link>
        {' · '}
        <Link to="/slot" className="text-cyan-400 hover:underline">
          Slot
        </Link>
        {' · '}
        <Link to="/marketplace" className="text-cyan-400 hover:underline">
          Marketplace
        </Link>
        {' · '}
        <Link to="/museum" className="text-cyan-400 hover:underline">
          Musée
        </Link>
      </p>
    </div>
  )
}
