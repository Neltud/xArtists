import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import PackCheckout from '../components/PackCheckout'
import PageGuide from '../components/PageGuide'
import LiaVsUserBanner from '../components/LiaVsUserBanner'
import MyNftPacksStrip from '../components/MyNftPacksStrip'
import { AGENT_PACKS } from '../config/agentPacks'
import { timingDefaults } from '../config/chainTiming'
import { requestOpenConnect } from '../lib/walletEvents'
import { useUserAccount } from '../hooks/useUserAccount'
import { matchOnChainPacks, loadOwnedPacks } from '../lib/nftPacks'

type LedgerFile = {
  scenarios?: Record<
    string,
    {
      decision?: { strategy?: string; action?: string; confidence?: number }
      tickets?: Array<{
        pack: string
        ok: boolean
        size_usd: number
        action: string
        strategy: string
        reason: string
        agent_id?: string
      }>
      totals?: { notional_usd?: number; pnl_usd_paper?: number }
    }
  >
}

const LEDGER_URL =
  (import.meta.env.VITE_PAPER_LEDGER_URL as string | undefined) ||
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/simulated_ledger.json'

const API = (import.meta.env.VITE_ACCESS_API_BASE as string | undefined) || ''

export default function MyPacks() {
  const { connected, address, method } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const chainHits = useMemo(() => matchOnChainPacks(account.nfts), [account.nfts])
  const sessionPacks = useMemo(() => loadOwnedPacks(), [account.refreshedAt, connected])
  const [params] = useSearchParams()
  const [ledger, setLedger] = useState<LedgerFile | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [mintStatus, setMintStatus] = useState<string | null>(null)

  const paid = params.get('paid') === '1'
  const cancelled = params.get('cancelled') === '1'
  const sessionId = params.get('session_id')

  useEffect(() => {
    let cancelledFetch = false
    const load = async () => {
      try {
        const r = await fetch(`${LEDGER_URL}?t=${Date.now()}`, { cache: 'no-store' })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const j = (await r.json()) as LedgerFile
        if (!cancelledFetch) setLedger(j)
      } catch (e) {
        if (!cancelledFetch) setErr(e instanceof Error ? e.message : 'ledger error')
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => {
      cancelledFetch = true
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!paid || !sessionId || !API) {
      if (paid && !sessionId) {
        setMintStatus('Payment return — waiting webhook mint (no session_id).')
      }
      return
    }
    let stop = false
    let n = 0
    const pollMs = timingDefaults().mintStatusPollMs
    const poll = async () => {
      try {
        const r = await fetch(`${API}/v1/checkout/status/${sessionId}`)
        const j = await r.json()
        if (stop) return
        setMintStatus(
          `${j.status}${j.tx_hash ? ` · tx ${String(j.tx_hash).slice(0, 12)}…` : ''}${j.error ? ` · ${j.error}` : ''}`
        )
        if (j.status === 'minted' || j.status === 'failed') return
      } catch {
        if (!stop) setMintStatus('Polling mint status…')
      }
      n += 1
      if (n < 40 && !stop) setTimeout(poll, pollMs)
    }
    poll()
    return () => {
      stop = true
    }
  }, [paid, sessionId])

  const feed = useMemo(() => {
    const rows: Array<{
      pack: string
      strategy: string
      action: string
      size_usd: number
      reason: string
      scenario: string
    }> = []
    if (!ledger?.scenarios) return rows
    for (const [scenario, body] of Object.entries(ledger.scenarios)) {
      for (const t of body.tickets || []) {
        rows.push({
          pack: t.pack,
          strategy: t.strategy,
          action: t.action,
          size_usd: t.size_usd || 0,
          reason: t.reason,
          scenario,
        })
      }
    }
    return rows.filter(r => r.size_usd > 0 || r.reason.includes('block')).slice(0, 12)
  }, [ledger])

  return (
    <div className="animate-fade-in max-w-3xl mx-auto pb-24 md:pb-8 space-y-6">
      <PageGuide page="my-packs" />
      <LiaVsUserBanner tone="user" />

      <header>
        <h1 className="text-2xl sm:text-3xl font-black">My Packs</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Access membership · on-chain si NFT détecté · sinon{' '}
          <span className="text-amber-300 font-medium">PAPER</span> session · Model C — pas un fonds
          géré
        </p>
        {chainHits.length > 0 && (
          <p className="text-xs text-emerald-400/90 mt-1">
            {chainHits.length} pack NFT on-chain · {new Set(chainHits.map(h => h.packId)).size}{' '}
            série(s)
          </p>
        )}
        {!connected && (
          <p className="text-xs text-zinc-500 mt-1">Connecte erd1 pour lire la propriété on-chain.</p>
        )}
        {sessionPacks.length > 0 && chainHits.length === 0 && (
          <p className="text-xs text-amber-400/80 mt-1">
            Session paper locale : {sessionPacks.join(', ')} (pas une preuve on-chain)
          </p>
        )}
      </header>

      <MyNftPacksStrip />

      {cancelled && (
        <div className="rounded-xl border border-zinc-600 bg-zinc-900/80 px-4 py-3 text-xs text-zinc-300">
          Payment cancelled — no charge · no mint.
        </div>
      )}
      {paid && (
        <div
          className="rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-3 text-xs text-teal-100"
          role="status"
        >
          <p className="font-semibold">Payment flow returned</p>
          <p className="mt-1 opacity-90">
            {mintStatus || 'Mint after verified Stripe webhook. Keep tab open if polling enabled.'}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-100/90 leading-relaxed">
        Tu achètes un <strong>access pass</strong> écosystème LIA. Les trades ci-dessous sont{' '}
        <strong>simulés (paper)</strong>. <strong>Aucun capital réel</strong> n’est tradé pour ce pack à
        ce stade. ≠ GreenSmoke · ≠ Portfolio LIA ops.
      </div>

      <div
        className="rounded-xl border border-purple-500/35 bg-purple-500/10 px-4 py-3 text-xs text-purple-50 leading-relaxed"
        role="status"
      >
        <p className="font-semibold text-purple-100">Capital agent (optionnel) — spec prête</p>
        <p className="mt-1 text-purple-100/90">
          Après mint on-chain : dépôt <strong>isolé par NFT</strong>, plafond{' '}
          <strong>10× prix mint</strong>, trades sous Guardian + Intent, retrait après cooldown{' '}
          <strong>48h</strong>. Pas de pool partagé (pas de contagion).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="rounded-lg border border-purple-400/30 bg-purple-950/40 px-3 py-1.5 text-[11px] text-purple-200/70 cursor-not-allowed"
            title="SC capital-escrow non déployé"
          >
            Fund · Soon
          </button>
          <button
            type="button"
            disabled
            className="rounded-lg border border-purple-400/30 bg-purple-950/40 px-3 py-1.5 text-[11px] text-purple-200/70 cursor-not-allowed"
            title="SC capital-escrow non déployé"
          >
            Withdraw · Soon
          </button>
          <Link
            to="/trading"
            className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-[11px] text-teal-100 hover:bg-teal-500/20"
          >
            Voir compounding LIA (paper) →
          </Link>
        </div>
        <p className="mt-2 text-[10px] text-purple-200/60">
          Spec : packages/capital-escrow-pack · docs/AGENT_CAPITAL_ESCROW.md · mint SC encore codeHash
          null
        </p>
      </div>

      <PackCheckout />

      <section className="card">
        <h2 className="font-bold text-sm text-zinc-300 mb-2">Wallet (destination mint)</h2>
        {connected && address ? (
          <>
            <p className="font-mono text-xs text-zinc-400 break-all">{address}</p>
            <p className="text-[10px] text-zinc-600 mt-1">
              method {method || '—'}{' '}
              {method === 'paste_readonly' && '· lecture seule OK pour destination mint'}
            </p>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-zinc-500">Connect MultiversX avant checkout.</p>
            <button type="button" onClick={requestOpenConnect} className="btn-primary text-xs">
              🔗 Connect
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-bold text-sm text-teal-200">Paper performance by pack</h2>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">poll 30s</span>
        </div>
        {err && <p className="text-xs text-red-400 mb-2">Ledger: {err}</p>}
        <div className="grid sm:grid-cols-3 gap-3">
          {AGENT_PACKS.map(p => {
            const tickets = Object.values(ledger?.scenarios || {}).flatMap(s =>
              (s.tickets || []).filter(t => t.pack === p.id && t.ok && t.size_usd > 0)
            )
            const notional = tickets.reduce((s, t) => s + t.size_usd, 0)
            const onChain = chainHits.some(h => h.packId === p.id)
            return (
              <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                <p className={`font-semibold text-sm ${p.color}`}>
                  {p.icon} {p.name}
                  {onChain && (
                    <span className="ml-2 text-[9px] uppercase text-emerald-400/90">on-chain</span>
                  )}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Simulated notional</p>
                <p className="text-lg font-black text-white mt-1">
                  {notional > 0 ? `$${notional.toFixed(2)}` : '—'}
                </p>
                <p className="text-[10px] text-zinc-600">paper · not live PnL on your capital</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h2 className="font-bold text-sm text-zinc-300 mb-3">Simulation feed</h2>
        {feed.length === 0 ? (
          <p className="text-xs text-zinc-500">
            No tickets —{' '}
            <code className="text-[10px]">python scripts/simulate_multi_capital_ledger.py</code>
          </p>
        ) : (
          <ul className="space-y-2">
            {feed.map((t, i) => (
              <li
                key={`${t.scenario}-${t.pack}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-zinc-800/80 pb-2"
              >
                <span className="font-semibold text-zinc-200 capitalize">{t.pack}</span>
                <span className="text-zinc-400">
                  {t.strategy} {t.action}
                </span>
                <span className={t.size_usd > 0 ? 'text-teal-300 font-semibold' : 'text-zinc-500'}>
                  {t.size_usd > 0 ? `$${t.size_usd.toFixed(2)}` : t.reason}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-zinc-600">
        <Link to="/agents" className="text-purple-400 hover:underline">
          ← Packs catalog
        </Link>
        {' · '}
        <Link to="/wallet" className="text-purple-400 hover:underline">
          Wallet / My Tokens
        </Link>
        {' · '}
        <Link to="/trading" className="text-purple-400 hover:underline">
          Trading / compounding
        </Link>
        {' · '}
        docs/PHASE1_MODEL_C_PROTOCOL.md
      </p>
    </div>
  )
}
