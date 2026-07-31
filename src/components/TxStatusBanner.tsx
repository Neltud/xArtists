import React from 'react'
import type { TxStatusState } from '../services/txErrors'
import './TxStatusBanner.css'

type Props = {
  state: TxStatusState
  onDismiss?: () => void
}

const PHASE_LABEL: Record<string, string> = {
  idle: '',
  building: 'Préparation…',
  signing: 'Signature…',
  broadcasting: 'Envoi…',
  pending: 'Confirmation…',
  success: 'Succès',
  failed: 'Échec',
  cancelled: 'Annulé',
}

const TxStatusBanner: React.FC<Props> = ({ state, onDismiss }) => {
  if (state.phase === 'idle' && !state.error) return null

  const tone =
    state.phase === 'success'
      ? 'ok'
      : state.phase === 'failed' || state.phase === 'cancelled'
        ? 'err'
        : 'info'

  return (
    <div className={`tx-banner tone-${tone}`} role="status" aria-live="polite">
      <div className="tx-banner-main">
        <strong>{PHASE_LABEL[state.phase] || state.phase}</strong>
        {state.message && <span>{state.message}</span>}
        {state.error && state.error.detail && state.error.detail !== state.message && (
          <span className="tx-detail">{state.error.detail}</span>
        )}
        {state.error?.retryable && state.phase === 'failed' && (
          <span className="tx-hint">Réessai possible</span>
        )}
      </div>
      <div className="tx-banner-actions">
        {state.explorerUrl && (
          <a href={state.explorerUrl} target="_blank" rel="noreferrer">
            Explorer
          </a>
        )}
        {onDismiss && (
          <button type="button" className="tx-dismiss" onClick={onDismiss} aria-label="Fermer">
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default TxStatusBanner
