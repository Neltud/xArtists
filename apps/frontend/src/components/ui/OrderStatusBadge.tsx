import type { OrderState } from '../../domain/order'

const LABEL: Record<OrderState, string> = {
  DRAFT: 'Brouillon',
  QUOTED: 'Devisé',
  POLICY_CHECKED: 'Politique OK',
  AWAITING_HUMAN_APPROVAL: 'Approbation',
  APPROVED: 'Approuvé',
  SUBMITTED: 'Envoyé',
  CONFIRMED: 'Confirmé',
  FAILED: 'Échec',
  UNKNOWN: 'Inconnu',
  HALTED: 'Stoppé',
}

type Props = {
  state: OrderState
  className?: string
}

export default function OrderStatusBadge({ state, className = '' }: Props) {
  const danger = state === 'FAILED' || state === 'UNKNOWN' || state === 'HALTED'
  const ok = state === 'CONFIRMED' || state === 'APPROVED'
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}
      style={{
        borderColor: danger
          ? 'rgba(248, 113, 113, 0.4)'
          : ok
            ? 'rgba(205, 245, 139, 0.45)'
            : 'var(--xa-border)',
        color: danger ? '#fecaca' : ok ? 'var(--xa-accent)' : 'var(--xa-text-muted)',
        background: danger
          ? 'rgba(248, 113, 113, 0.08)'
          : ok
            ? 'var(--xa-accent-soft, rgba(205, 245, 139, 0.12))'
            : 'rgba(255,255,255,0.03)',
      }}
    >
      {LABEL[state]}
    </span>
  )
}
