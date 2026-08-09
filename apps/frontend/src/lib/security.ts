/** Frontend security helpers — no secrets, fail closed on protocol wallet. */
const LIA_OPS = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const ERD_RE = /^erd1[a-z0-9]{58}$/

export function isValidErdAddress(addr: string): boolean {
  return ERD_RE.test((addr || '').trim().toLowerCase())
}

export function isLiaProtocolAddress(addr: string): boolean {
  return (addr || '').trim().toLowerCase() === LIA_OPS
}

export function safeExternalUrl(url: string): string | null {
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://neltud.github.io')
    if (!['http:', 'https:'].includes(u.protocol)) return null
    return u.toString()
  } catch {
    return null
  }
}

export function explorerTxUrl(txHash: string): string | null {
  if (!/^[0-9a-fA-F]{64}$/.test(txHash)) return null
  return `https://explorer.multiversx.com/transactions/${txHash}`
}

export function explorerAccountUrl(addr: string): string | null {
  if (!isValidErdAddress(addr)) return null
  return `https://explorer.multiversx.com/accounts/${addr}`
}

export function redactAddress(addr: string): string {
  const a = (addr || '').trim()
  if (a.length < 12) return '…'
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}
