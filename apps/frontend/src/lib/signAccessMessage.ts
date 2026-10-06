/** SIWX sign via active xPortal WC session. */
import { getXPortalSession } from './xportalWc'

function sigToHex(sig: unknown): string | null {
  if (!sig) return null
  if (typeof sig === 'string') return sig.replace(/^0x/, '')
  if (sig instanceof Uint8Array) {
    return Array.from(sig)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  if (typeof sig === 'object' && sig !== null) {
    const o = sig as { hex?: string; signature?: string; value?: string }
    if (o.hex) return o.hex.replace(/^0x/, '')
    if (o.signature) return String(o.signature).replace(/^0x/, '')
    if (o.value) return String(o.value).replace(/^0x/, '')
  }
  return null
}

export async function signAccessMessage(
  message: string,
): Promise<{ ok: true; signature: string } | { ok: false; error: string }> {
  const session = getXPortalSession()
  if (!session?.provider) return { ok: false, error: 'no_xportal_session' }
  const provider = session.provider as { signMessage?: (msg: unknown) => Promise<unknown> }
  if (typeof provider.signMessage !== 'function') {
    return { ok: false, error: 'provider_no_signMessage' }
  }
  try {
    let raw: unknown
    try {
      raw = await provider.signMessage(message)
    } catch {
      raw = await provider.signMessage({ message })
    }
    const hex = sigToHex(raw)
    if (!hex || hex.length < 64) return { ok: false, error: 'bad_signature_shape' }
    return { ok: true, signature: hex }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/reject|denied|cancel/i.test(msg)) return { ok: false, error: 'user_rejected' }
    return { ok: false, error: msg.slice(0, 120) }
  }
}
