/** Never pass objects as React children (React error #31). */

export function asText(value: unknown, fallback = '—'): string {
  if (value == null) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'bigint') return value.toString()
  try {
    return JSON.stringify(value)
  } catch {
    return fallback
  }
}
