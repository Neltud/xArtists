/** B — validation URL utilisateur (Studio, metadata). */
export function isSafeHttpUrl(raw: string): boolean {
  const s = (raw || '').trim()
  if (!s) return false
  try {
    if (s.startsWith('ipfs://')) return s.length > 7 && !s.includes(' ')
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    if (u.username || u.password) return false
    return true
  } catch {
    return false
  }
}

export function sanitizeExternalUrl(raw: string): string | undefined {
  const s = (raw || '').trim()
  if (!isSafeHttpUrl(s)) return undefined
  return s
}

export function plainText(raw: string, max = 2000): string {
  return String(raw || '').replace(/[<>]/g, '').slice(0, max)
}
