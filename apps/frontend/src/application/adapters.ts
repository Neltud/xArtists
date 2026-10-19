/**
 * Transport adapter contracts (ADR 0001).
 * Implementations live outside domain/application; no live swap in tests/CI.
 */

import type { ChainId } from '../domain/chain'

export type SubmitResult =
  | { status: 'submitted'; txHash: string }
  | { status: 'failed'; error: string }
  | { status: 'unknown'; detail?: string }

export type VerifyResult =
  | { status: 'confirmed'; txHash: string }
  | { status: 'failed'; txHash: string; error?: string }
  | { status: 'unknown'; txHash: string }

/**
 * Chain submitter — MultiversX (or future opt-in Solana) after human approval.
 * Must not treat frontend flags as approval.
 */
export interface IChainSubmitter {
  readonly chainId: ChainId
  submit(signedPayload: unknown): Promise<SubmitResult>
}

/** On-chain verification after broadcast. */
export interface ITxVerifier {
  readonly chainId: ChainId
  verify(txHash: string): Promise<VerifyResult>
}

export type PaymentSessionRequest = {
  packId: string
  buyerAddress: string
  /** Client must not send amount; server catalog is source of truth */
}

export type PaymentSessionResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; error: string; httpStatus?: number }

/**
 * Access-API payment session (Stripe/Paybox).
 * Amounts ignored client-side; fail-closed until HMAC + IPN exist.
 */
export interface IPaymentSession {
  createSession(req: PaymentSessionRequest): Promise<PaymentSessionResult>
}

export type AuditEvent = {
  digestHash: string
  orderId: string
  event: string
  at: number
  meta?: Record<string, string | number | boolean | null>
}

/**
 * Append-only audit. Client implementations are non-authoritative;
 * production enforcement requires a trusted service.
 */
export interface IAuditLog {
  append(event: AuditEvent): Promise<void>
}

/** No-op audit for tests / local UI. */
export class MemoryAuditLog implements IAuditLog {
  readonly events: AuditEvent[] = []
  async append(event: AuditEvent): Promise<void> {
    this.events.push(event)
  }
}

/** Submitter that always fails closed — safe default until wired. */
export class RejectingChainSubmitter implements IChainSubmitter {
  constructor(readonly chainId: ChainId = 'mvx') {}
  async submit(_signedPayload: unknown): Promise<SubmitResult> {
    return { status: 'failed', error: 'submitter_not_wired' }
  }
}
