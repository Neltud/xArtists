import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Reality signal — simulation vs live vs loading.
 * LIVE only when VITE_LIA_LIVE_TRADING=1 AND connected wallet can sign.
 * Default product posture: PAPER (no live LIA TX).
 */
import { memo, useMemo } from 'react'
import { useWallet } from '../../context/WalletContext'

export type RealityMode = 'simulation' | 'live' | 'loading'

function detectMode(connected: boolean, canSign: boolean, loading?: boolean): RealityMode {
  if (loading) return 'loading'
  const envLive =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIA_LIVE_TRADING === '1'
  // Fail-closed: wallet alone never implies LIVE trading
  if (envLive && connected && canSign) return 'live'
  return 'simulation'
}

function StatusIndicator({
  loading,
  className = '',
}: {
  loading?: boolean
  className?: string
}) {
  const { connected, canAttemptSign, method } = useWallet()
  const mode = useMemo(
    () => detectMode(!!connected, canAttemptSign !== false, loading),
    [connected, canAttemptSign, loading],
  )

  const meta = {
    simulation: {
      label: 'PAPER',
      detail: connected
        ? `wallet · ${method || 'ro'} · LIA live=0`
        : 'demo · aucune TX LIA',
      color: '#22d3ee',
      icon: '◇',
    },
    live: {
      label: 'LIVE',
      detail: 'LIA live=1 · signing · Guardian',
      color: '#34d399',
      icon: '◈',
    },
    loading: {
      label: '…',
      detail: 'sync',
      color: '#a1a1aa',
      icon: '○',
    },
  }[mode]

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${className}`}
      style={
        {
          ['--status-color' as string]: meta.color,
          ['--status-icon' as string]: `"${meta.icon}"`,
          borderColor: `${meta.color}55`,
          background: `${meta.color}18`,
          color: meta.color,
        } as React.CSSProperties
      }
      role="status"
      aria-label={`Mode ${meta.label}: ${meta.detail}`}
      title={meta.detail}
    >
      <span aria-hidden className="opacity-90">
        {xaRender(meta.icon)}
      </span>
      <span>{xaRender(meta.label)}</span>
      <span className="hidden sm:inline font-normal opacity-70 max-w-[160px] truncate">
        {xaRender(meta.detail)}
      </span>
    </div>
  )
}

export default memo(StatusIndicator)
