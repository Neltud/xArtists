import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO_BULLETS, DEMO_PATH } from '../config/demoMode'
import { isSupernovaLive, SUPERNOVA_ROUND_MS, SUPERNOVA_HUB } from '../config/supernova'
import Phase4ReadinessBanner from '../components/Phase4ReadinessBanner'
import {
  FALLBACK_SNAPSHOT,
  liaOpsFunded,
  probeNetwork,
  supernovaAgeEpochs,
  type NetworkSnapshot,
} from '../lib/networkProbe'

const STEPS = [
  {
    n: '01',
    to: '/',
    title: 'Accueil',
    body: 'Persona, Pulse strip, probe mainnet live. Chrome paper — pas un marché live.',
  },
  {
    n: '02',
    to: '/museum',
    title: 'Galerie',
    body: 'Collections on-chain lues via API NFT (NFTUDURI, TRO SFT, MAS…). Visite, pas mint.',
  },
  {
    n: '03',
    to: '/agents',
    title: 'Packs Pulse · Yield · Sentinel',
    body: 'Catalogue paper. Achat on-chain bloqué tant que agents-marketplace n’a pas de codeHash. Phase 4 badge.',
  },
  {
    n: '04',
    to: '/tours',
    title: 'Tours art',
    body: 'Service CULTURE — carte des lieux. Ce n’est pas un pack agent.',
  },
  {
    n: '05',
    to: '/wallet',
    title: 'Wallet user',
    body: 'Connect lecture ESDT / NFT. Wallet Connect ≠ wallet LIA Ops. Tips possibles si solde.',
  },
  {
    n: '06',
    to: '/trading',
    title: 'Board LIA',
    body: 'Paper compounding. LIA_LIVE_TRADING=0. Aucun mouvement auto de fonds.',
  },
  {
    n: '07',
    to: '/market',
    title: 'Analyse',
    body: 'Lecture stats / paires. List / Buy / Bid marketplace fail-closed (SC empty).',
  },
  {
    n: '08',
    to: '/simulation',
    title: 'Sim Lab',
    body: 'Trades simulés côté client. Pas de broadcast.',
  },
  {
    n: '09',
    to: '/go-live',
    title: 'GO_LIVE checklist',
    body: 'Suite logique : dest wallets, PEM local, simulate → deploy → verify codeHash → MX-8004 register.',
  },
] as const

export default function DemoTourPage() {
  const [snap, setSnap] = useState<NetworkSnapshot>(FALLBACK_SNAPSHOT)

  useEffect(() => {
    let c = false
    probeNetwork().then(s => {
      if (!c) setSnap(s)
    })
    return () => {
      c = true
    }
  }, [])

  const funded = liaOpsFunded(snap.liaOps.balanceEgld)
  const GATES = [
    {
      ok: !snap.sc.marketplace.codeEmpty,
      label: 'Marketplace NFT codeHash',
      value: snap.sc.marketplace.codeEmpty ? 'null — List/Buy/Bid OFF' : 'live',
    },
    { ok: false, label: 'Agents marketplace', value: 'non déployé' },
    {
      ok: !snap.sc.nftStaking.codeEmpty,
      label: 'Staking / gov / minter',
      value: snap.sc.nftStaking.codeEmpty ? 'comptes empty' : 'codeHash',
    },
    { ok: false, label: 'LIA live trading', value: 'OFF (paper)' },
    {
      ok: funded,
      label: 'LIA Ops funded',
      value: `${snap.liaOps.balanceEgld.toFixed(4)} EGLD · nonce ${snap.liaOps.nonce}`,
    },
    { ok: true, label: 'Supernova mainnet', value: `${SUPERNOVA_ROUND_MS} ms · epoch ${snap.epoch}` },
    { ok: false, label: 'MX-8004 Identity', value: 'not registered (Phase 4 pending)' },
    { ok: true, label: 'Pages demo', value: 'GO_DEMO + Phase 4 section' },
  ]

  return (
    <div className="page-wrap py-10 space-y-10">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-400/80">Parcours démo</p>
        <h1 className="display text-3xl md:text-4xl text-white">GO_DEMO — tour complet</h1>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          xArtists sur MultiversX : galerie + packs paper + board LIA. Probe live epoch{' '}
          {snap.epoch} (J+{supernovaAgeEpochs(snap.epoch)}). Les smart contracts produit n’ont pas de{' '}
          <code className="text-zinc-300">codeHash</code>. Rien ici n’allume le live.
        </p>
        {isSupernovaLive() && (
          <a
            href={SUPERNOVA_HUB}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-[11px] text-cyan-400/80 hover:text-cyan-300"
          >
            Mainnet 600 ms (Supernova) →
          </a>
        )}
      </header>

      <Phase4ReadinessBanner variant="full" />

      <ul className="grid gap-2 text-sm text-zinc-400">
        {DEMO_BULLETS.map(b => (
          <li key={b} className="flex gap-2">
            <span className="text-amber-400/80">▸</span>
            {b}
          </li>
        ))}
      </ul>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Étapes (2–6 min)</h2>
        <ol className="grid md:grid-cols-2 gap-3">
          {STEPS.map(s => (
            <li key={s.n}>
              <Link
                to={s.to}
                className="block rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-cyan-400/30 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] text-zinc-600 font-mono">{s.n}</span>
                  <span className="text-[10px] text-cyan-500/80">{s.to}</span>
                </div>
                <h3 className="mt-1 text-white text-sm font-medium">{s.title}</h3>
                <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{s.body}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Raccourcis</h2>
        <div className="flex flex-wrap gap-2">
          {DEMO_PATH.map(p => (
            <Link
              key={p.to}
              to={p.to}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 hover:border-cyan-400/40"
            >
              {p.label}
              <span className="ml-1 text-zinc-600">{p.hint}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Gates honnêtes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <tbody>
              {GATES.map(g => (
                <tr key={g.label} className="border-t border-white/5">
                  <td className="py-2 pr-3 text-zinc-400">{g.label}</td>
                  <td className={g.ok ? 'text-cyan-400' : 'text-amber-400/90'}>{g.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Recap technique : docs/ANALYSE_DAPP_COMPLETE.md · Phase 4 : docs/MX8004_FIRST100_ALIGNMENT.md ·
        SoT : data/contracts.json. Pas un conseil en investissement. Tips ≠ investissement. Probe{' '}
        {snap.ok ? 'live' : 'cache'} {snap.probedAt}.
      </p>
    </div>
  )
}
