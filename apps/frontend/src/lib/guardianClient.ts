/**
 * Optional Guardian HTTP client (ops backend).
 * Default: offline — front uses lipBridge evaluateGuardian.
 * Set VITE_GUARDIAN_API_URL to enable remote validate.
 */

export type GuardianIntentBody = {
  user_address: string
  action: string
  target_address?: string
  amount?: number
  asset_id?: string
  paper?: boolean
  metadata?: Record<string, unknown>
}

export type GuardianValidateResult =
  | { ok: true; status: string; message: string; payload?: Record<string, unknown>; paper: boolean }
  | { ok: false; status: string; message: string }

const base = () =>
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GUARDIAN_API_URL) || ''

export async function guardianValidateIntent(
  body: GuardianIntentBody
): Promise<GuardianValidateResult> {
  const root = base()
  if (!root) {
    return {
      ok: false,
      status: 'OFFLINE',
      message: 'Guardian API non configurée (VITE_GUARDIAN_API_URL). Utilise lipBridge local.',
    }
  }
  try {
    const r = await fetch(`${root.replace(/\/$/, '')}/intent/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chain: 'multiversx',
        paper: body.paper !== false,
        ...body,
      }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      return {
        ok: false,
        status: 'DENIED',
        message: j.detail || j.message || r.statusText,
      }
    }
    return {
      ok: true,
      status: j.status || 'APPROVED',
      message: j.message || 'APPROVED',
      payload: j.payload,
      paper: j.paper !== false,
    }
  } catch (e) {
    return {
      ok: false,
      status: 'ERROR',
      message: e instanceof Error ? e.message : 'Guardian unreachable',
    }
  }
}
