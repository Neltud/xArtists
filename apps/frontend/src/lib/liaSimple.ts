/** Structured LIA paper-only API: does not touch hosted checkout or sign a transaction. */
import { getAccessApiBase } from './stripe'
import type {
  SimpleIntent, SimpleIntentHttpRequest, PreparedSimpleIntent, SimplePaperReceipt,
} from '../../../../packages/lia-intent/src/simple'

async function submit(request: SimpleIntentHttpRequest, accessToken: string): Promise<unknown> {
  const base = getAccessApiBase()
  if (!base) throw new Error('LIA API indisponible : VITE_ACCESS_API_BASE manquant')
  if (!accessToken) throw new Error('Connexion du wallet requise')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(base + '/api/lia/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
      cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify(request),
    })
    const data = await response.json().catch(() => ({})) as { error?: string; status?: string; ok?: boolean }
    if (!response.ok || data.ok !== true) {
      throw new Error(data.error || ('lia_paper_http_' + response.status))
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

export async function prepareSimplePack(intent: SimpleIntent, token: string): Promise<PreparedSimpleIntent> {
  const response = await submit({ action: 'prepare', intent }, token) as PreparedSimpleIntent
  if (response.status !== 'ready' || response.mode !== 'paper' ||
      response.paperMode !== true || response.quote?.payable !== false ||
      response.requiresConfirmation !== true) throw new Error('lia_paper_response_invalid')
  return response
}

export async function confirmSimplePack(confirmationId: string, token: string): Promise<SimplePaperReceipt> {
  const response = await submit({ action: 'confirm', confirmationId }, token) as SimplePaperReceipt
  if (response.status !== 'paper_success' || response.paperMode !== true ||
      response.paymentVerified !== false || response.deliveryVerified !== false ||
      response.nftMinted !== false || response.amountChargedCents !== 0) {
    throw new Error('lia_paper_receipt_invalid')
  }
  return response
}

export async function cancelSimplePack(confirmationId: string, token: string): Promise<void> {
  const response = await submit({ action: 'cancel', confirmationId }, token) as { status: string; mode: string }
  if (response.status !== 'cancelled' || response.mode !== 'paper') {
    throw new Error('lia_paper_cancel_invalid')
  }
}
