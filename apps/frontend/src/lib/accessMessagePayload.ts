import { Message } from '@multiversx/sdk-core'

type AccessProvider = { signMessage?: (message: Message) => Promise<unknown> }
type SignResult = { ok: true; signature: string } | { ok: false; error: string }

function signatureHex(value: unknown, depth = 0): string | null {
  if (depth > 2) return null
  if (value instanceof Uint8Array) return Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('')
  if (typeof value === 'string') return value.replace(/^0x/i, '')
  if (value && typeof value === 'object') {
    const object = value as { signature?: unknown; hex?: unknown; value?: unknown }
    return signatureHex(object.signature ?? object.hex ?? object.value, depth + 1)
  }
  return null
}

/** Use the SDK's message shape once; never retry a declined wallet prompt. */
export async function signAccessWithProvider(provider: AccessProvider, text: string): Promise<SignResult> {
  if (typeof provider.signMessage !== 'function') return { ok: false, error: 'provider_no_signMessage' }
  try {
    const message = new Message({ data: new TextEncoder().encode(text) })
    const signed = await provider.signMessage(message)
    const hex = signatureHex(signed)
    if (!hex || !/^[0-9a-f]{128}$/i.test(hex)) return { ok: false, error: 'bad_signature_shape' }
    return { ok: true, signature: hex.toLowerCase() }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: /reject|denied|cancel/i.test(message) ? 'user_rejected' : message.slice(0, 120) }
  }
}
