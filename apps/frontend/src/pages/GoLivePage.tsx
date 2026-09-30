/**
 * Checklist GO_LIVE mainnet — PUBLIC OPEN 2026-09-30.
 */
import { Link } from 'react-router-dom'
import { AGENT_8008 } from '../config/agent8008'
import { PACK_PRICE_EGLD } from '../config/multichain'
import DustTestPanel from '../components/DustTestPanel'
import { getEnvLiveCapable, getAppMode } from '../lib/appMode'

type Item = { id: string; label: string; ok: boolean; note?: string; href?: string }

function envFlag(name: string): boolean {
  try {
    const v = (import.meta as { env?: Record<string, string> }).env?.[name]
    return v === 'true' || v === '1'
  } catch {
    return false
  }
}

export default function GoLivePage() {
  const publicLive = true // house funded · no multisig · 2026-09-30
  const pulseApi = Boolean((import.meta as { env?: { VITE_PULSE_API?: string } }).env?.VITE_PULSE_API)
  const liveCapable = getEnvLiveCapable()
  const appMode = getAppMode()
  const vellum = Boolean(
    (import.meta as { env?: { VITE_VELLUM_8008_WEBHOOK?: string } }).env?.VITE_VELLUM_8008_WEBHOOK,
  )

  const scItems: Item[] = [
    {
      id: 'pem',
      label: 'SC_DEPLOYER_PEM dans GitHub Secrets (jamais VITE_*)',
      ok: true,
      note: 'ops — hors repo',
    },
    {
      id: 'venue',
      label: 'SC venue-split deploy + verify codeHash',
      ok: envFlag('VITE_VENUE_CODEHASH_OK'),
    },
    {
      id: 'market',
      label: 'SC marketplace deploy + verify',
      ok: envFlag('VITE_MARKETPLACE_CODEHASH_OK'),
    },
    {
      id: 'tro',
      label: 'SC tro_staking + CODEHASH',
      ok: envFlag('VITE_TRO_STAKING_CODEHASH_OK'),
    },
    {
      id: 'slot',
      label: 'SC slot deploy + verify',
      ok: envFlag('VITE_SLOT_CODEHASH_OK') || envFlag('VITE_SLOT_CASINO_CODEHASH_OK'),
    },
    {
      id: 'flags',
      label: 'Flags VITE_*_CODEHASH_OK après explorer verify',
      ok:
        envFlag('VITE_VENUE_CODEHASH_OK') &&
        envFlag('VITE_MARKETPLACE_CODEHASH_OK') &&
        envFlag('VITE_TRO_STAKING_CODEHASH_OK'),
      note: 'Sinon paper fail-closed',
    },
    {
      id: 'house',
      label: 'House Slot funded — first spins open',
      ok: true,
      note: 'PUBLIC GO LIVE',
    },
  ]

  const infra: Item[] = [
    {
      id: 'live',
      label: 'VITE_LIVE_MODE=1 ou VITE_APP_MODE=live (build)',
      ok: liveCapable,
      note: `runtime: ${appMode}`,
    },
    {
      id: 'pulse',
      label: 'pulse-api live + VITE_PULSE_API',
      ok: pulseApi,
      note: pulseApi ? 'injecté au build' : 'démo cycle Pages',
      href: '/#/',
    },
    {
      id: 'vellum',
      label: 'VITE_VELLUM_8008_WEBHOOK (proxy, pas clé Vellum)',
      ok: vellum,
      note: vellum ? 'PULSE_HYPE → Vellum' : 'journal local only',
    },
    {
      id: 'xportal',
      label: 'WalletConnect allowlist neltud.github.io',
      ok: true,
      note: 'GO LIVE — xPortal users OK',
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
      label: `Packs Agent IA (${PACK_PRICE_EGLD} EGLD paper)`,
      ok: true,
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
      ok: envFlag('VITE_TRO_STAKING_CODEHASH_OK'),
      note: '1 TX user réelle = validation',
      href: '/#/staking',
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
                {it.href && (
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
        <p className="section-label">Mainnet · discipline</p>
        {publicLive && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-[13px] text-emerald-100">
            <strong className="font-tech text-emerald-300">PUBLIC GO LIVE</strong>
            {' — '}House funded · first spins open · multisig non requis · all SC LIVE mainnet
          </div>
        )}
        <h1 className="section-title display">GO_LIVE checklist</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          PUBLIC OPEN — house funded, first user spins authorized. Gates still fail-closed if CODEHASH
          secret missing. Dust panel below for team verification.
        </p>
      </header>

      <DustTestPanel />
      {render('Smart contracts', scItems)}
      {render('Infra & secrets', infra)}
      {render('Produit', product)}

      <div className="card border border-amber-500/20 bg-amber-500/[0.04] text-[12px] text-zinc-400 space-y-1">
        <p className="text-amber-200/90 font-medium">Règles non négociables</p>
        <p>· PEM hors git / chat / Akash / front</p>
        <p>· CODEHASH secrets only — never commit =1</p>
        <p>· Safety Switch → paper auto sur échec gas/contract</p>
        <p>· Owner peut setPaused en urgence (pas de multisig requis)</p>
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
