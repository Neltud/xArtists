/**
 * Wallet utilisateur — connect live + soldes + tokens ESDT + NFTs on-chain.
 * Jamais le wallet protocole LIA.
 */
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import InfoTip from '../components/InfoTip'
import WalletConnectPanel from '../components/WalletConnectPanel'
import MyNftPacksStrip from '../components/MyNftPacksStrip'
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

export default function Wallet() {
  const { connected, address, shortAddress, method, canAttemptSign } = useWallet()
  const account = useUserAccount(connected ? address : null)

  const egldLabel =
    account.loading || !connected
      ? null
      : Number.isFinite(account.balanceEgld)
        ? account.balanceEgld.toLocaleString('en-US', { maximumFractionDigits: 6 })
        : '—'

  return (
    <div className="animate-fade-in space-y-5 pb-10 max-w-xl">
      <PageGuide page="wallet" />

      <header className="space-y-1">
        <p className="section-label text-cyan-400/80">Compte</p>
        <h1 className="page-title">Wallet</h1>
        <p className="page-sub inline-flex flex-wrap items-center gap-1">
          Ton MultiversX — pas le wallet protocole LIA
          <InfoTip k="liaVsUser" />
        </p>
      </header>

      {!connected ? (
        <div className="card space-y-4">
          <p className="text-sm text-zinc-400">
            Connecte Web Wallet, xPortal ou extension pour voir soldes, tokens, NFTs et signer.
          </p>
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => requestOpenConnect()}>
            Connecter
          </button>
          <WalletConnectPanel />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="mono text-sm text-white">{shortAddress}</span>
              <span className={method === 'paste_readonly' ? 'badge-orange' : 'badge-green'}>
                {method === 'paste_readonly' ? 'lecture seule' : method || 'connecté'}
              </span>
            </div>
            <p className="mono text-[10px] text-zinc-600 break-all">{address}</p>
            {canAttemptSign === false && (
              <p className="text-xs text-amber-400/90">
                Mode lecture seule — reconnecte via Web Wallet pour signer.
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-[10px]">
              <a
                href={`https://explorer.multiversx.com/accounts/${address}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400/90 hover:text-cyan-300 underline underline-offset-2"
              >
                Explorer ↗
              </a>
              <button type="button" onClick={() => account.refresh()} className="text-zinc-500 hover:text-white">
                ↻ Refresh
              </button>
            </div>
          </div>

          <div className="card">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Solde EGLD</p>
            {account.loading ? (
              <p className="text-zinc-500 text-sm">Chargement…</p>
            ) : account.error ? (
              <p className="text-rose-400 text-sm">{account.error}</p>
            ) : (
              <p className="display text-2xl text-white">
                {egldLabel}
                <span className="text-sm font-normal text-zinc-500 ml-2">EGLD</span>
              </p>
            )}
            <p className="text-xs text-zinc-500 mt-2">
              {account.tokens.length} ESDT · {account.nftCount} NFT
              {account.refreshedAt
                ? ` · maj ${new Date(account.refreshedAt).toLocaleTimeString()}`
                : ''}
            </p>
          </div>

          <section className="card space-y-3" aria-labelledby="my-tokens-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="my-tokens-title" className="text-[10px] uppercase tracking-wider text-cyan-300/90 font-semibold">
                My Tokens
              </h2>
              <span className="text-[10px] text-zinc-600 mono">{account.tokens.length}</span>
            </div>
            {account.loading && account.tokens.length === 0 && (
              <p className="text-sm text-zinc-500">Chargement tokens ESDT…</p>
            )}
            {!account.loading && account.tokens.length === 0 && (
              <p className="text-sm text-zinc-500">Aucun token ESDT sur cette adresse.</p>
            )}
            {account.tokens.length > 0 && (
              <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {account.tokens.map(t => (
                  <li
                    key={t.identifier}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-black/25 px-2.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-white font-medium truncate">
                        {t.ticker}
                        <span className="text-zinc-500 font-normal ml-1.5">{t.name}</span>
                      </p>
                      <p className="text-[9px] text-zinc-600 mono truncate">{t.identifier}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-zinc-200 mono">
                        {t.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </p>
                      {t.valueUsd > 0 && (
                        <p className="text-[10px] text-zinc-500">
                          ≈ ${t.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card space-y-3" aria-labelledby="my-nfts-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="my-nfts-title" className="text-[10px] uppercase tracking-wider text-violet-300/90 font-semibold">
                My NFTs
              </h2>
              <span className="text-[10px] text-zinc-600 mono">{account.nfts.length}</span>
            </div>
            {account.loading && account.nfts.length === 0 && (
              <p className="text-sm text-zinc-500">Chargement des NFTs…</p>
            )}
            {!account.loading && account.nfts.length === 0 && (
              <p className="text-sm text-zinc-500">Aucun NFT sur cette adresse.</p>
            )}
            {account.nfts.length > 0 && (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {account.nfts.map(n => {
                  const thumb = nftThumb(n)
                  const href =
                    typeof LINKS?.explorerNft === 'function'
                      ? LINKS.explorerNft(n.identifier)
                      : `https://explorer.multiversx.com/nfts/${n.identifier}`
                  return (
                    <li key={n.identifier}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-white/10 bg-black/30 overflow-hidden hover:border-violet-400/40 transition-colors"
                      >
                        <div className="aspect-square bg-zinc-900/80 flex items-center justify-center">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={n.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={e => {
                                ;(e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <span className="text-2xl opacity-40">🖼️</span>
                          )}
                        </div>
                        <div className="px-2 py-1.5">
                          <p className="text-[11px] text-white truncate font-medium">{n.name}</p>
                          <p className="text-[9px] text-zinc-500 truncate mono">{n.collection}</p>
                        </div>
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <MyNftPacksStrip />

          <WalletConnectPanel />

          <div className="flex flex-wrap gap-2">
            <Link to="/marketplace" className="btn-secondary text-xs">Marketplace</Link>
            <Link to="/agents" className="btn-secondary text-xs">Packs</Link>
            <Link to="/my-packs" className="btn-secondary text-xs">My Packs</Link>
            <Link to="/museum" className="btn-secondary text-xs">Musée</Link>
          </div>
        </div>
      )}
    </div>
  )
}
