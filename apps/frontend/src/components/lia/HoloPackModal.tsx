/**
 * Modale holo pack — NFT gate Command Center + disclosure économique.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { PackId } from '../../config/agentPacks'
import { AGENT_PACKS } from '../../config/agentPacks'
import { useWallet } from '../../context/WalletContext'
import { useUserAccount } from '../../hooks/useUserAccount'
import { holderStatus } from '../../lib/holderAccess'
import { requestOpenConnect } from '../../lib/walletEvents'
import { useI18n } from '../../i18n/I18nContext'
import EconomicDisclosure from './EconomicDisclosure'

type Props = {
  packId: PackId | null
  onClose: () => void
}

const PACK_LABEL: Record<PackId, string> = {
  pulse: 'PULSE',
  yield: 'YIELD',
  sentinel: 'SENTINEL',
}

export function HoloPackModal({ packId, onClose }: Props) {
  const { t, lang } = useI18n()
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)

  const status = useMemo(() => holderStatus(account.nfts || []), [account.nfts])

  if (!packId) return null
  const pack = AGENT_PACKS.find(p => p.id === packId)
  if (!pack) return null

  const ownsThis =
    status.packs.includes(packId) ||
    (packId === 'pulse' && status.pulse) ||
    (packId === 'yield' && status.yield) ||
    (packId === 'sentinel' && status.sentinel)

  const packName = PACK_LABEL[packId]
  const ccTo = `/command-center?room=${packId}`

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-md"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-purple-500/30 bg-black/85 shadow-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">
              {t('pack.gate.kicker')}
            </p>
            <h2 className="text-xl font-semibold text-white">
              {ownsThis ? (
                <>
                  {pack.icon} {pack.name} · {pack.tierLabel}
                </>
              ) : (
                t('pack.gate.title')
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-white/15 text-zinc-300"
            aria-label={lang === 'en' ? 'Close' : 'Fermer'}
          >
            ✕
          </button>
        </div>

        {!ownsThis ? (
          <>
            <p className="text-[13px] text-zinc-300 leading-relaxed">
              {t('pack.gate.locked').replace('{pack}', packName)}
            </p>
            <p className="text-[12px] text-zinc-500">{pack.tagline}</p>
            <EconomicDisclosure />
            {!connected && (
              <p className="text-[12px] text-amber-200/90">{t('pack.gate.connectFirst')}</p>
            )}
            {connected && account.loading && (
              <p className="text-[12px] text-zinc-500">{t('pack.gate.checking')}</p>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/agents"
                className="btn-primary text-sm min-h-[44px] inline-flex items-center justify-center"
                onClick={onClose}
              >
                {t('pack.gate.acquire')}
              </Link>
              <button
                type="button"
                className="btn-secondary text-sm min-h-[44px] w-full"
                onClick={() => {
                  if (!connected) {
                    requestOpenConnect()
                    return
                  }
                  void account.refresh?.()
                }}
              >
                {t('pack.gate.verify')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[13px] text-emerald-200/90 leading-relaxed">
              {t('pack.gate.unlocked').replace('{pack}', packName)}
            </p>
            <EconomicDisclosure />
            <ul className="text-[12px] text-zinc-400 space-y-1 list-disc list-inside">
              {(pack.entitlements || []).slice(0, 4).map(e => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to={ccTo}
                className="btn-primary text-sm min-h-[44px] inline-flex items-center justify-center gap-2"
                onClick={onClose}
              >
                {t('pack.gate.enterCc')}
              </Link>
              <Link
                to="/agents"
                className="btn-secondary text-sm min-h-[44px] inline-flex items-center justify-center"
                onClick={onClose}
              >
                {t('pack.cta.agents')}
              </Link>
            </div>
          </>
        )}

        <p className="text-[10px] text-zinc-600 leading-relaxed">{t('pack.gate.disclaimer')}</p>
      </div>
    </div>
  )
}

export default HoloPackModal
