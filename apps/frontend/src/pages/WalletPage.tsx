/** Wallet — session, balances, MoonPay — protocol UI. */
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { requestOpenConnect } from '../lib/walletEvents'
import { clearXPortalSession } from '../lib/xportalWc'
import { useToast } from '../components/ui/Toast'
import MoonPayBuyButton from '../components/MoonPayBuyButton'
import { useI18n } from '../i18n/I18nContext'

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1000) return n.toFixed(2)
  if (n >= 1) return n.toFixed(4)
  return n.toPrecision(3)
}

export default function WalletPage() {
  const { t, lang } = useI18n()
  const { connected, address, method, sessionLive, canAttemptSign, disconnect } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const { push } = useToast()
  const [params, setParams] = useSearchParams()
  const isFr = lang === 'fr'

  useEffect(() => {
    if (params.get('moonpay') === 'done') {
      push(
        isFr
          ? 'Retour MoonPay — vérifie ton solde EGLD (quelques minutes).'
          : 'MoonPay return — check EGLD balance (a few minutes).',
        'ok',
      )
      const n = new URLSearchParams(params)
      n.delete('moonpay')
      setParams(n, { replace: true })
    }
  }, [params, setParams, push, isFr])

  return (
    <div className="xa-page animate-fade-in space-y-8 max-w-xl mx-auto pb-16">
      <header className="xa-hero" style={{ paddingTop: '1.25rem', maxWidth: '100%' }}>
        <p className="xa-hero__kicker">{t('wallet.title')}</p>
        <h1 className="xa-hero__title">{t('wallet.session')}</h1>
        <p className="xa-hero__lead">
          {isFr
            ? 'Session MultiversX · recharge EGLD · signatures xPortal.'
            : 'MultiversX session · EGLD top-up · xPortal signatures.'}
        </p>
      </header>

      {!connected ? (
        <div className="xa-card space-y-4">
          <p className="text-sm text-[var(--xa-text-secondary)]">
            {isFr ? 'Aucune session active.' : 'No active session.'}
          </p>
          <button type="button" className="xa-btn-primary" onClick={requestOpenConnect}>
            {t('common.connect')}
          </button>
          <div className="pt-2 border-t border-[var(--xa-border)]">
            <p className="text-xs text-[var(--xa-text-muted)] mb-2">
              {isFr ? 'Pas encore d’EGLD ?' : 'No EGLD yet?'}
            </p>
            <MoonPayBuyButton amountEur={50} />
          </div>
        </div>
      ) : (
        <>
          <div className="xa-card space-y-2 text-sm">
            <p className="text-[11px] uppercase tracking-wider text-[var(--xa-text-muted)]">
              {t('wallet.session')}
            </p>
            <p className="mono text-xs text-[var(--xa-text)] break-all">{address}</p>
            <p className="text-xs text-[var(--xa-text-secondary)]">
              {method === 'xportal'
                ? sessionLive
                  ? isFr
                    ? 'xPortal · prêt à signer'
                    : 'xPortal · ready to sign'
                  : isFr
                    ? 'xPortal · reconnecte si signature refuse'
                    : 'xPortal · reconnect if sign fails'
                : method === 'paste_readonly'
                  ? isFr
                    ? 'Lecture seule — pas de signature'
                    : 'Read-only — no signing'
                  : method || 'wallet'}
            </p>
            {!canAttemptSign && (
              <p className="text-xs text-[var(--xa-accent)]">
                {isFr
                  ? 'Reconnecte xPortal pour signer les TX.'
                  : 'Reconnect xPortal to sign transactions.'}
              </p>
            )}
            <button
              type="button"
              className="xa-btn-secondary"
              onClick={() => {
                clearXPortalSession()
                disconnect()
                push(isFr ? 'Déconnecté' : 'Disconnected', 'info')
              }}
            >
              {t('common.disconnect')}
            </button>
          </div>

          <div className="xa-card space-y-3 text-sm">
            <div className="flex justify-between items-baseline">
              <span className="text-[var(--xa-text-muted)]">EGLD</span>
              <strong className="text-[var(--xa-text)] tabular-nums text-lg">
                {account.loading ? '…' : fmt(account.balanceEgld)}
              </strong>
            </div>
            <p className="text-xs text-[var(--xa-text-muted)]">
              Tokens {account.tokens?.length ?? 0} · NFT {account.nfts?.length ?? 0}
            </p>
            <MoonPayBuyButton amountEur={30} label={isFr ? 'Recharger EGLD · MoonPay' : 'Top up EGLD · MoonPay'} />
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/market" className="xa-btn-primary text-sm">
                {t('nav.market')}
              </Link>
              <Link to="/staking" className="xa-btn-secondary text-sm">
                {t('nav.staking')}
              </Link>
              <Link to="/portfolio" className="xa-btn-secondary text-sm">
                Portfolio
              </Link>
            </div>
          </div>
        </>
      )}

      <p className="xa-disclaimer">
        {isFr
          ? 'Non-custodial. xArtists ne détient jamais tes clés ni tes fonds.'
          : 'Non-custodial. xArtists never holds your keys or funds.'}
      </p>
    </div>
  )
}
