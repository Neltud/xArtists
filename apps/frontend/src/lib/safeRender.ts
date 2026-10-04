/** Never pass objects as React children (React error #31). */

export function asText(value: unknown, fallback = '—'): string {
  if (value == null) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Error) return value.message || fallback
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    if ('message' in o && o.message != null) return asText(o.message, fallback)
    if ('reason' in o && o.reason != null) return asText(o.reason, fallback)
    if ('error' in o && o.error != null) return asText(o.error, fallback)
    if ('code' in o && typeof o.code === 'string') return o.code
    // Pricing shapes { min, max, list }
    if ('min' in o && typeof o.min === 'number') return String(o.min)
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

/**
 * Safe RCE / pricing display — never render raw objects (MOD-V1.2).
 * Accepts number, string, or { min, max?, list? }.
 */
export function formatRCE(data: unknown, unit = 'EGLD'): string {
  if (data == null) return `— ${unit}`
  if (typeof data === 'number' && Number.isFinite(data)) {
    return `${data} ${unit}`
  }
  if (typeof data === 'string') return data.includes(unit) ? data : `${data} ${unit}`
  if (typeof data === 'object') {
    const o = data as Record<string, unknown>
    const min = typeof o.min === 'number' ? o.min : null
    const list = typeof o.list === 'number' ? o.list : null
    const max = typeof o.max === 'number' ? o.max : null
    if (min != null && max != null) return `${min}–${max} ${unit}`
    if (list != null) return `${list} ${unit}`
    if (min != null) return `${min} ${unit}`
  }
  return `${asText(data)} ${unit}`
}
