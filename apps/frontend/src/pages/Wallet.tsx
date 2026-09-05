/**
 * Wallet — calme : soldes, tokens, NFT. Packs = page My Packs uniquement.
 */
import { Link } from 'react-router-dom'
import InfoTip from '../components/InfoTip'
import BridgeUsdtCard from '../components/BridgeUsdtCard'
import { useWallet } from '../context/WalletContext'
import { useUserAccount, type UserNft } from '../hooks/useUserAccount'
import { requestOpenConnect } from '../lib/walletEvents'
import { LINKS } from '../config/links'

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

  const tokens = (account.tokens || []).slice(0, 12)

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

      {!connected ? (
        <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-6 space-y-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Connectez Web Wallet, xPortal ou l’extension pour afficher soldes, tokens et NFT.
          </p>
          <button type="button" className="btn-primary" onClick={() => requestOpenConnect()}>
            Connecter
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-5 space-y-3">
            <p className="font-mono text-[11px] text-zinc-500 break-all leading-relaxed">{address}</p>
            <p className="text-[11px] text-zinc-600">
              {shortAddress}
              {method ? ` · ${method}` : ''}
              {!canAttemptSign ? ' · lecture seule' : ''}
            </p>
            {egldLabel != null && (
              <p className="text-2xl font-semibold text-white tracking-tight pt-1">
                {egldLabel}{' '}
                <span className="text-sm font-normal text-zinc-500">EGLD</span>
              </p>
            )}
            {account.loading && <p className="text-xs text-zinc-600">Mise à jour…</p>}
          </div>

          <BridgeUsdtCard compact />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">Tokens</h2>
            {account.loading && tokens.length === 0 ? (
              <p className="text-xs text-zinc-600">Lecture…</p>
            ) : tokens.length === 0 ? (
              <p className="text-xs text-zinc-600 rounded-xl border border-white/5 px-3 py-3">
                Aucun ESDT notable.
              </p>
            ) : (
              <ul className="rounded-2xl border border-white/[0.07] divide-y divide-white/[0.05] overflow-hidden">
                {tokens.map(t => (
                  <li
                    key={t.identifier}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white/[0.02]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{t.ticker}</p>
                      <p className="text-[10px] text-zinc-600 truncate">{t.name}</p>
                    </div>
                    <p className="text-sm tabular-nums text-zinc-300 shrink-0">{fmtBal(t.balance)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">NFT</h2>
              <Link
                to="/museum?tab=mine"
                className="text-[11px] text-zinc-500 hover:text-white transition-colors"
              >
                Galerie →
              </Link>
            </div>
            {account.loading && !(account.nfts || []).length ? (
              <p className="text-xs text-zinc-600">Lecture…</p>
            ) : !(account.nfts || []).length ? (
              <p className="text-xs text-zinc-600 rounded-xl border border-white/5 px-3 py-3">
                Aucun NFT.
              </p>
            ) : (
              <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(account.nfts || []).slice(0, 16).map(n => (
                  <li
                    key={n.identifier}
                    className="rounded-xl border border-white/[0.07] overflow-hidden bg-black/40 aspect-square"
                  >
                    {nftThumb(n) ? (
                      <img
                        src={nftThumb(n)}
                        alt={n.name || n.identifier}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] text-zinc-600 p-1 text-center">
                        {n.name || n.identifier.slice(0, 10)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-[12px] text-zinc-600 flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/my-packs" className="hover:text-zinc-300 transition-colors">
              My Packs
            </Link>
            <a
              href={address ? LINKS.explorerAccount(address) : LINKS.explorer}
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              Explorer
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
