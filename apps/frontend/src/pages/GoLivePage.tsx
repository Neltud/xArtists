/**
 * Checklist GO_LIVE mainnet — SC fail-closed jusqu’à verify.
 */
import { Link } from 'react-router-dom'
import { AGENT_8008 } from '../config/agent8008'
import { PACK_PRICE_EGLD } from '../config/multichain'

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
  const pulseApi = Boolean((import.meta as { env?: { VITE_PULSE_API?: string } }).env?.VITE_PULSE_API)
  const vellum = Boolean(
    (import.meta as { env?: { VITE_VELLUM_8008_WEBHOOK?: string } }).env?.VITE_VELLUM_8008_WEBHOOK,
  )

  const scItems: Item[] = [
    {
      id: 'pem',
      label: 'SC_DEPLOYER_PEM dans GitHub Secrets (jamais VITE_*)',
      ok: false,
      note: 'À cocher manuellement ops',
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
      id: 'slot',
      label: 'SC slot deploy + verify (optionnel phase 1)',
      ok: envFlag('VITE_SLOT_CODEHASH_OK'),
    },
    {
      id: 'flags',
      label: 'Flags VITE_*_CODEHASH_OK = true après explorer verify',
      ok:
        envFlag('VITE_VENUE_CODEHASH_OK') &&
        envFlag('VITE_MARKETPLACE_CODEHASH_OK'),
      note: 'Sinon paper fail-closed',
    },
  ]

  const infra: Item[] = [
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
      ok: false,
      note: 'Cloud project e07ac8e2… — cocher ops',
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
      label: `Packs floor ≥ ${PACK_PRICE_EGLD.min} EGLD`,
      ok: true,
      href: '/agents',
    },
    {
      id: 'studio',
      label: 'Studio créateur accessible',
      ok: true,
      href: '/studio',
    },
    {
      id: 'tro',
      label: '$TRO tokenomics page',
      ok: true,
      href: '/tro',
    },
    {
      id: '8008',
      label: `Agent ${AGENT_8008.id} intents paper`,
      ok: true,
      href: '/lia',
    },
  ]

  const render = (title: string, items: Item[]) => (
    <section className="card space-y-2">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="space-y-2">
        {items.map(it => (
          <li key={it.id} className="flex gap-2 items-start text-[13px]">
            <span className={it.ok ? 'text-emerald-400' : 'text-amber-400'}>{it.ok ? '✓' : '○'}</span>
            <div className="min-w-0">
              {it.href ? (
                <Link to={it.href} className="text-zinc-200 hover:text-white hover:underline">
                  {it.label}
                </Link>
              ) : (
                <span className="text-zinc-200">{it.label}</span>
              )}
              {it.note && <p className="text-[11px] text-zinc-500">{it.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6 pb-16">
      <header className="space-y-2">
        <p className="section-label">Mainnet · discipline</p>
        <h1 className="section-title display">GO_LIVE checklist</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          Aucun SC public tant que codeHash non vérifié. Paper fail-closed = comportement correct.
        </p>
      </header>

      {render('Smart contracts', scItems)}
      {render('Infra & secrets', infra)}
      {render('Produit', product)}

      <div className="card border border-amber-500/20 bg-amber-500/[0.04] text-[12px] text-zinc-400 space-y-1">
        <p className="text-amber-200/90 font-medium">Règles non négociables</p>
        <p>· PEM hors git / chat / Akash / front</p>
        <p>· Pas de deploy mainnet sans revue humaine</p>
        <p>· Holder paper ≠ autorisation on-chain</p>
        <p>· Voir docs/SECRETS_MAINNET.md</p>
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
        <Link to="/tro" className="text-cyan-400 hover:underline">
          $TRO
        </Link>
        {' · '}
        <Link to="/" className="text-cyan-400 hover:underline">
          Dashboard
        </Link>
      </p>
    </div>
  )
}
