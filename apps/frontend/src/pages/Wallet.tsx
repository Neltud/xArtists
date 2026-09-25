/**
 * Wallet user — soldes + daily points + lien trésorerie LIA (lecture).
 */
import { Link } from 'react-router-dom'
import InfoTip from '../components/InfoTip'
import BridgeUsdtCard from '../components/BridgeUsdtCard'
import DailyCheckIn from '../components/DailyCheckIn'
import LiaTreasuryPanel from '../components/LiaTreasuryPanel'
import { useWallet } from '../context/WalletContext'
import { useUserAccount, type UserNft } from '../hooks/useUserAccount'
import { requestOpenConnect } from '../lib/walletEvents'
import { LINKS } from '../config/links'
import { matchEligiblePair } from '../config/lpPools'

function nftThumb(n: UserNft): string | undefined {
  if (n.url && /^https?:\/\//i.test(n.url)) return n.url
  const m = n.media?.[0]?.url
  if (m && /^https?:\/\//i.test(m)) return m
  return undefined
}

function fmtBal(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
  if (n > 0) return n.toExponential(2)
  return '0'
}

export default function Wallet() {
  const { connected, address, shortAddress, method, canAttemptSign } = useWallet()
  const account = useUserAccount(connected ? address : null)

  const egldLabel =
    account.loading || !connected
      ? null
      : Number.isFinite(account.balanceEgld)
        ? account.balanceEgld.toLocaleString('en-US', { maximumFractionDigits: 6 })
        : '—'

  const tokens = (account.tokens || []).slice(0, 24)
  const lpTokens = tokens.filter(t => {
    const id = String((t as { identifier?: string }).identifier || '')
    const name = String((t as { name?: string }).name || '')
    return matchEligiblePair(id, name)
  })

  return (
    <div className="animate-fade-in space-y-6 pb-12 max-w-xl mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Compte
          </p>
          <InfoTip>
            <span className="text-zinc-400">
              Votre adresse uniquement — jamais une adresse protocole.
            </span>
          </InfoTip>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Wallet</h1>
      </header>

      <DailyCheckIn />

      {!connected ? (
        <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-6 space-y-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Connectez <strong className="text-zinc-300">Web Wallet</strong> (recommandé) ou tentez
            xPortal. Les soldes, LP et NFT s’affichent ici.
          </p>
          <button type="button" className="btn-primary" onClick={() => requestOpenConnect()}>
            Connecter
          </button>
          <p className="text-[11px] text-zinc-600">
            Si xPortal échoue : Web Wallet fonctionne toujours sur GitHub Pages.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-4 space-y-2">
            <p className="text-[11px] text-zinc-500">
              {method} · {canAttemptSign ? 'signature possible' : 'lecture seule'}
            </p>
            <p className="font-mono text-sm text-white break-all">{address}</p>
            <p className="text-2xl font-semibold text-white tabular-nums">
              {egldLabel ?? '…'}{' '}
              <span className="text-base text-zinc-500 font-normal">EGLD</span>
            </p>
          </div>

          {lpTokens.length > 0 && (
            <section className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300/80">
                LP éligibles DAO
              </p>
              <ul className="space-y-1 text-[12px]">
                {lpTokens.map(t => {
                  const id = String((t as { identifier?: string }).identifier || '')
                  const bal = Number((t as { balance?: number }).balance ?? 0)
                  const pair = matchEligiblePair(id, String((t as { name?: string }).name || ''))
                  return (
                    <li key={id} className="flex justify-between gap-2 text-zinc-300">
                      <span>{pair?.label || id}</span>
                      <span className="tabular-nums text-zinc-500">{fmtBal(bal)}</span>
                    </li>
                  )
                })}
              </ul>
              <Link to="/dao" className="text-[11px] text-cyan-300 hover:underline">
                Voter en DAO →
              </Link>
            </section>
          )}

          <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Tokens
            </p>
            {account.loading && <p className="text-sm text-zinc-500">Chargement…</p>}
            {!account.loading && tokens.length === 0 && (
              <p className="text-sm text-zinc-600">Aucun ESDT</p>
            )}
            <ul className="space-y-1.5 max-h-56 overflow-y-auto">
              {tokens.map(t => {
                const id = String((t as { identifier?: string }).identifier || '')
                const name = String(
                  (t as { ticker?: string }).ticker ||
                    (t as { name?: string }).name ||
                    id,
                )
                const bal = Number((t as { balance?: number }).balance ?? 0)
                return (
                  <li
                    key={id}
                    className="flex justify-between gap-2 text-[12px] border-t border-white/5 pt-1.5"
                  >
                    <span className="text-zinc-200 truncate">{name}</span>
                    <span className="tabular-nums text-zinc-500 shrink-0">{fmtBal(bal)}</span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              NFT ({(account.nfts || []).length})
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {(account.nfts || []).slice(0, 8).map((n, i) => {
                const thumb = nftThumb(n)
                return (
                  <div
                    key={(n as { identifier?: string }).identifier || i}
                    className="aspect-square rounded-lg bg-zinc-900 border border-white/10 overflow-hidden"
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-600">
                        NFT
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <BridgeUsdtCard />
        </div>
      )}

      <LiaTreasuryPanel />

      <p className="text-[11px] text-zinc-600">
        <Link to="/dao" className="text-zinc-400 hover:text-white">
          DAO
        </Link>
        {' · '}
        <Link to="/tip" className="text-zinc-400 hover:text-white">
          Tip LIA
        </Link>
        {' · '}
        <a
          href={LINKS.explorer}
          className="text-zinc-400 hover:text-white"
          target="_blank"
          rel="noreferrer"
        >
          Explorer
        </a>
      </p>
    </div>
  )
}
