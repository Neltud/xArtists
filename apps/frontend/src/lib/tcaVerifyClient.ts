/** Sprint 1.1 / 1.1b — verify-access + SIWX via xPortal signAccessMessage. */
import type { TcaAccessResult } from './tcaAccess'
import { signAccessMessage } from './signAccessMessage'

const TOKEN_KEY = 'xartists_tca_access_jwt'

export type VerifyAccessResponse = {
  ok: boolean
  status: 'FULL' | 'SAMPLE' | 'NONE'
  hasAccess: boolean
  reason: string
  expiryDate: string | null
  source?: string
  token?: string | null
  sampleLessonId?: string
  packId?: string
  error?: string
  siwx?: string
}

function apiBase(): string {
  return ((import.meta.env.VITE_ACCESS_API_BASE as string) || '').replace(/\/$/, '')
}

export function demoPacksAllowed(): boolean {
  if (import.meta.env.PROD) return false
  return import.meta.env.VITE_ALLOW_TCA_DEMO_PACKS === 'true'
}

export function storeAccessToken(token: string | null | undefined) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* */
  }
}

async function fetchChallenge(address: string): Promise<{
  message: string
  nonce: string
  require_siwx?: boolean
} | null> {
  const base = apiBase()
  if (!base) return null
  try {
    const r = await fetch(`${base}/v1/access/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })
    if (!r.ok) return null
    return (await r.json()) as { message: string; nonce: string; require_siwx?: boolean }
  } catch {
    return null
  }
}

async function trySignAccessMessage(message: string): Promise<string | null> {
  const viaPortal = await signAccessMessage(message)
  if (viaPortal.ok) return viaPortal.signature
  return null
}

export async function verifyAccessRemote(
  address: string | null | undefined,
): Promise<{ access: TcaAccessResult; raw: VerifyAccessResponse | null; fromServer: boolean }> {
  const fallbackNone: TcaAccessResult = {
    hasAccess: false,
    status: 'NONE',
    reason: 'no_wallet',
    expiryDate: null,
    features: ['gallery_info'],
    sampleLessonId: 'sample_01',
    packId: 'pulse_pack_v1',
  }
  const fallbackSample: TcaAccessResult = {
    hasAccess: false,
    status: 'SAMPLE',
    reason: 'verify_unavailable',
    expiryDate: null,
    features: ['sample_lesson'],
    sampleLessonId: 'sample_01',
    packId: 'pulse_pack_v1',
  }

  if (!address) {
    storeAccessToken(null)
    return { access: fallbackNone, raw: null, fromServer: false }
  }

  const base = apiBase()
  if (!base) {
    storeAccessToken(null)
    return { access: { ...fallbackSample, reason: 'no_access_api_base' }, raw: null, fromServer: false }
  }

  let signature: string | null = null
  let message = ''
  let nonce = ''
  const ch = await fetchChallenge(address)
  if (ch?.message) {
    message = ch.message
    nonce = ch.nonce
    signature = await trySignAccessMessage(message)
  }

  try {
    const body: Record<string, string> = { address }
    if (signature && message) {
      body.signature = signature
      body.message = message
      if (nonce) body.nonce = nonce
    }
    const r = await fetch(`${base}/v1/verify-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await r.json()) as VerifyAccessResponse
    if (!r.ok || !data.ok) {
      storeAccessToken(null)
      return {
        access: { ...fallbackSample, reason: data.reason || data.error || 'verify_http_error' },
        raw: data,
        fromServer: true,
      }
    }
    storeAccessToken(data.token || null)
    const features =
      data.status === 'FULL'
        ? ['classroom', 'qa_rag', 'hd', 'agenda', 'unlimited_qa']
        : data.status === 'SAMPLE'
          ? ['sample_lesson']
          : ['gallery_info']
    return {
      access: {
        hasAccess: Boolean(data.hasAccess && data.status === 'FULL'),
        status: data.status,
        reason: data.reason,
        expiryDate: data.expiryDate,
        features,
        sampleLessonId: data.sampleLessonId || 'sample_01',
        packId: data.packId || 'pulse_pack_v1',
      },
      raw: data,
      fromServer: true,
    }
  } catch {
    storeAccessToken(null)
    return { access: { ...fallbackSample, reason: 'verify_network_error' }, raw: null, fromServer: false }
  }
}
