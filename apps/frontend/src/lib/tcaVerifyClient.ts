/** Sprint 1.1 — server verify-access client. No FULL from localStorage in PROD. */
import type { TcaAccessResult } from './tcaAccess'

const TOKEN_KEY = 'xartists_tca_access_jwt'

export type VerifyAccessResponse = {
  ok: boolean
  status: 'FULL' | 'SAMPLE' | 'NONE'
  hasAccess: boolean
  reason: string
  expiryDate: string | null
  source?: string
  identifier?: string | null
  token?: string | null
  expiresIn?: number | null
  sampleLessonId?: string
  packId?: string
  error?: string
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

export function readAccessToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
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
    return {
      access: { ...fallbackSample, reason: 'no_access_api_base' },
      raw: null,
      fromServer: false,
    }
  }

  try {
    const r = await fetch(`${base}/v1/verify-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })
    const data = (await r.json()) as VerifyAccessResponse
    if (!r.ok || !data.ok) {
      storeAccessToken(null)
      return {
        access: {
          ...fallbackSample,
          reason: data.reason || data.error || 'verify_http_error',
        },
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
    return {
      access: { ...fallbackSample, reason: 'verify_network_error' },
      raw: null,
      fromServer: false,
    }
  }
}
