/**
 * Portfolio — tokens + NFT — protocol UI.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { useI18n } from '../i18n/I18nContext'
import { requestOpenConnect } from '../lib/walletEvents'

const NFT_PAGE = 12

function fmtBal(balance: number, decimals = 4): string {
  if (!Number.isFinite(balance)) return '—'
  if (balance >= 1000) return balance.toFixed(2)
  if (balance >= 1) return balance.toFixed(decimals)
  return balance.toPrecision(3)
}

export default function PortfolioPage() {
  const { t, lang } = useI18n()
  const { connected, address, method } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const nfts = useMemo(() => (account.nfts || []).filter(n => n?.identifier), [account.nfts])
  const tokens = useMemo(() => (account.tokens || []).filter(t => t?.identifier), [account.tokens])
  const [nftVisible, setNftVisible] = useState(NFT_PAGE)
  const isFr = lang === 'fr'

  return (
    <div className="xa-page animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="xa-hero" style={{ paddingTop: '1.25rem', maxWidth: '100%' }}>
        <p className="xa-hero__kicker">{isFr ? 'Actifs' : 'Assets'}</p>
        <h1 className="xa-hero__title">Portfolio</h1>
        <p className="xa-hero__lead">
          {isFr
            ? 'Soldes EGLD, tokens ESDT et NFT du wallet connecté.'
            : 'EGLD balances, ESDT tokens and NFTs from the connected wallet.'}
        </p>
      </header>

      {!connected ? (
        <div className="xa-card space-y-3">
          <p className="text-sm text-[var(--xa-text-secondary)]">
            {isFr
              ? 'Connecte un wallet pour voir tes soldes et NFT.'
              : 'Connect a wallet to see balances and NFTs.'}
          </p>
          <button type="button" className="xa-btn-primary" onClick={requestOpenConnect}>
            {t('common.connect')}
          </button>
        </div>
      ) : (
        <>
          <div className="xa-card space-y-2 text-sm">
            <p className="text-[11px] text-[var(--xa-text-muted)] uppercase tracking-wider">
              {t('wallet.session')}
            </p>
            <p className="mono text-xs text-[var(--xa-text-secondary)] truncate">{address}</p>
            {method === 'paste_readonly' && (
              <p className="text-xs text-[var(--xa-accent)]">
                {isFr ? 'Lecture seule — pas de signature.' : 'Read-only — no signing.'}
              </p>
            )}
            <p className="text-[var(--xa-text-secondary)]">
              EGLD{' '}
              <strong className="text-[var(--xa-text)] tabular-nums">
                {account.loading ? '…' : fmtBal(account.balanceEgld ?? 0, 4)}
              </strong>
            </p>
          </div>

          <div className="xa-card space-y-3">
            <h2 className="text-sm font-semibold text-[var(--xa-text)]">
              Tokens ({tokens.length})
            </h2>
            {account.loading && (
              <p className="text-xs text-[var(--xa-text-muted)]">{t('common.loading')}</p>
            )}
            {!account.loading && tokens.length === 0 && (
              <p className="text-sm text-[var(--xa-text-muted)]">
                {isFr ? 'Aucun token ESDT.' : 'No ESDT tokens.'}
              </p>
            )}
            <ul className="space-y-1.5">
              {tokens.slice(0, 20).map(tok => (
                <li
                  key={tok.identifier}
                  className="flex justify-between gap-2 text-sm border-b border-[var(--xa-border)] py-1.5"
                >
                  <span className="text-[var(--xa-text-secondary)] truncate">
                    {tok.ticker || tok.identifier}
                  </span>
                  <span className="tabular-nums text-[var(--xa-text)] shrink-0">
                    {fmtBal(tok.balance, 4)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="xa-card space-y-3">
            <h2 className="text-sm font-semibold text-[var(--xa-text)]">NFT ({nfts.length})</h2>
            <p className="xa-disclaimer">
              {isFr
                ? 'Les packs IA ouvrent une salle dédiée.'
                : 'AI packs unlock a dedicated room.'}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {nfts.slice(0, nftVisible).map(n => {
                const media0 = n.media?.[0] as { thumbnailUrl?: string; url?: string } | undefined
                const thumb = n.url || media0?.thumbnailUrl || media0?.url || undefined
                return (
                  <div key={n.identifier} className="rounded-xl border border-[var(--xa-border)] p-1.5">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        loading="lazy"
                        className="w-full aspect-square object-cover rounded-lg bg-zinc-900"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-zinc-900" />
                    )}
                    <p className="text-[10px] text-[var(--xa-text-muted)] truncate mt-1">
                      {n.name || n.identifier}
                    </p>
                  </div>
                )
              })}
            </div>
            {nftVisible < nfts.length && (
              <button
                type="button"
                className="xa-btn-secondary text-xs"
                onClick={() => setNftVisible(v => v + NFT_PAGE)}
              >
                {isFr ? 'Voir plus' : 'Show more'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/market" className="xa-btn-primary text-sm">
              {t('nav.market')}
            </Link>
            <Link to="/museum" className="xa-btn-secondary text-sm">
              {t('nav.museum')}
            </Link>
            <Link to="/my-packs" className="xa-btn-secondary text-sm">
              {t('nav.packs')}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
