import { describe, expect, it } from 'vitest'
import {
  canTransition,
  isTerminal,
  markUnknownFromSubmitted,
  transition,
  type OrderState,
} from './order'

describe('order state machine', () => {
  it('allows happy path to CONFIRMED', () => {
    let s: OrderState = 'DRAFT'
    s = transition(s, 'QUOTED')
    s = transition(s, 'POLICY_CHECKED')
    s = transition(s, 'AWAITING_HUMAN_APPROVAL')
    s = transition(s, 'APPROVED')
    s = transition(s, 'SUBMITTED')
    s = transition(s, 'CONFIRMED')
    expect(s).toBe('CONFIRMED')
    expect(isTerminal(s)).toBe(true)
  })

  it('marks UNKNOWN from SUBMITTED (fail-closed)', () => {
    expect(markUnknownFromSubmitted('SUBMITTED')).toBe('UNKNOWN')
    expect(isTerminal('UNKNOWN')).toBe(true)
    expect(canTransition('UNKNOWN', 'SUBMITTED')).toBe(false)
  })

  it('rejects skip transitions', () => {
    expect(() => transition('DRAFT', 'APPROVED')).toThrow(/invalid_order_transition/)
  })

  it('HALTED is terminal', () => {
    expect(canTransition('DRAFT', 'HALTED')).toBe(true)
    expect(isTerminal('HALTED')).toBe(true)
  })
})
