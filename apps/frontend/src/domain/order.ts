/**
 * Order state machine (ADR 0001).
 * UNKNOWN is fail-closed: no automatic retry of a possibly broadcast order.
 */

export type OrderState =
  | 'DRAFT'
  | 'QUOTED'
  | 'POLICY_CHECKED'
  | 'AWAITING_HUMAN_APPROVAL'
  | 'APPROVED'
  | 'SUBMITTED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'UNKNOWN'
  | 'HALTED'

const TERMINAL: ReadonlySet<OrderState> = new Set([
  'CONFIRMED',
  'FAILED',
  'UNKNOWN',
  'HALTED',
])

/** Allowed single-step transitions. */
const TRANSITIONS: Record<OrderState, readonly OrderState[]> = {
  DRAFT: ['QUOTED', 'FAILED', 'HALTED'],
  QUOTED: ['POLICY_CHECKED', 'FAILED', 'HALTED'],
  POLICY_CHECKED: ['AWAITING_HUMAN_APPROVAL', 'FAILED', 'HALTED'],
  AWAITING_HUMAN_APPROVAL: ['APPROVED', 'FAILED', 'HALTED'],
  APPROVED: ['SUBMITTED', 'FAILED', 'HALTED'],
  SUBMITTED: ['CONFIRMED', 'FAILED', 'UNKNOWN', 'HALTED'],
  CONFIRMED: [],
  FAILED: [],
  UNKNOWN: [],
  HALTED: [],
}

export function isTerminal(state: OrderState): boolean {
  return TERMINAL.has(state)
}

export function canTransition(from: OrderState, to: OrderState): boolean {
  return (TRANSITIONS[from] ?? []).includes(to)
}

export function transition(from: OrderState, to: OrderState): OrderState {
  if (!canTransition(from, to)) {
    throw new Error(`invalid_order_transition: ${from} → ${to}`)
  }
  return to
}

/** After ambiguous broadcast outcome — never auto-retry. */
export function markUnknownFromSubmitted(from: OrderState): OrderState {
  return transition(from, 'UNKNOWN')
}
