/** Never pass objects as React children (React error #31). */

export function asText(value: unknown, fallback = '—'): string {
  if (value == null) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Error) return value.message || fallback
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    // Zod-like / API validation shapes { min, max, list } etc.
    if ('message' in o && o.message != null) return asText(o.message, fallback)
    if ('reason' in o && o.reason != null) return asText(o.reason, fallback)
    if ('error' in o && o.error != null) return asText(o.error, fallback)
    if ('code' in o && typeof o.code === 'string') return o.code
    try {
      return JSON.stringify(value)
    } catch {
      return fallback
    }
  }
  try {
    return String(value)
  } catch {
    return fallback
  }
}
