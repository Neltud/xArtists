/**
 * Read getStaked(user) + getTotalStaked from tro_staking SC (mainnet API).
 */
import { useCallback, useEffect, useState } from 'react'
import { TRO_STAKING_ADDRESS } from '../config/scStatus'
import { useWallet } from '../context/WalletContext'

const API = 'https://api.multiversx.com'
const TRO_DECIMALS = 6

function bech32ToHexAddress(bech: string): string | null {
  // Prefer API conversion via accounts — fallback: pass bech to query as hex via gateway
  // MultiversX vm-values expects hex address without 0x for args
  try {
    // lightweight: use gateway's convert if we already have from session
    return null
  } catch {
    return null
  }
}

async function addressToHex(erd: string): Promise<string | null> {
  try {
    // API returns hex in some endpoints; use convert
    const r = await fetch(`${API}/address/${erd}`, { cache: 'no-store' })
    if (!r.ok) {
      // try accounts
      const a = await fetch(`${API}/accounts/${erd}`, { cache: 'no-store' })
      if (!a.ok) return null
      const j = (await a.json()) as { address?: string; code?: string }
      // Use bech32 → hex via public converter endpoint
    }
  } catch {
    /* */
  }
  try {
    const r = await fetch(
      `https://api.multiversx.com/accounts/${erd}?withGuardianInfo=false`,
      { cache: 'no-store' },
    )
    if (!r.ok) return null
    // MultiversX REST does not return hex pubkey on accounts; encode client-side
    return bech32DecodeToHex(erd)
  } catch {
    return bech32DecodeToHex(erd)
  }
}

/** Minimal bech32 decode for erd1 addresses → 32-byte hex */
function bech32DecodeToHex(addr: string): string | null {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  const lower = addr.toLowerCase()
  if (!lower.startsWith('erd1')) return null
  const data = lower.slice(4)
  const values: number[] = []
  for (const c of data) {
    const v = CHARSET.indexOf(c)
    if (v < 0) return null
    values.push(v)
  }
  // convert 5-bit groups to 8-bit bytes, drop 6-byte checksum at end
  const bits = values.slice(0, -6)
  let acc = 0
  let bitsN = 0
  const out: number[] = []
  for (const v of bits) {
    acc = (acc << 5) | v
    bitsN += 5
    if (bitsN >= 8) {
      bitsN -= 8
      out.push((acc >> bitsN) & 0xff)
    }
  }
  if (out.length < 32) return null
  return out
    .slice(0, 32)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function decodeReturnData(b64: string | null | undefined): bigint {
  if (!b64) return 0n
  try {
    const bin = atob(b64)
    let n = 0n
    for (let i = 0; i < bin.length; i++) n = (n << 8n) + BigInt(bin.charCodeAt(i))
    return n
  } catch {
    return 0n
  }
}

async function vmQuery(sc: string, func: string, args: string[] = []): Promise<bigint> {
  const body = JSON.stringify({ scAddress: sc, funcName: func, args })
  const r = await fetch(`${API}/vm-values/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  if (!r.ok) return 0n
  const j = (await r.json()) as {
    data?: { data?: { returnData?: string[] } }
  }
  const rd = j?.data?.data?.returnData
  if (!rd || !rd.length) return 0n
  return decodeReturnData(rd[0])
}

export function useTroStakedBalance() {
  const { address, connected } = useWallet()
  const [userAtomic, setUserAtomic] = useState<bigint | null>(null)
  const [totalAtomic, setTotalAtomic] = useState<bigint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const sc = TRO_STAKING_ADDRESS
    if (!sc || !sc.startsWith('erd1')) {
      setUserAtomic(null)
      setTotalAtomic(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const total = await vmQuery(sc, 'getTotalStaked')
      setTotalAtomic(total)
      if (connected && address?.startsWith('erd1')) {
        const hex = bech32DecodeToHex(address)
        if (hex) {
          const staked = await vmQuery(sc, 'getStaked', [hex])
          setUserAtomic(staked)
        } else {
          setUserAtomic(null)
        }
      } else {
        setUserAtomic(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'query failed')
    } finally {
      setLoading(false)
    }
  }, [address, connected])

  useEffect(() => {
    void refresh()
    const t = setInterval(() => void refresh(), 45_000)
    return () => clearInterval(t)
  }, [refresh])

  const userTro =
    userAtomic == null ? null : Number(userAtomic) / 10 ** TRO_DECIMALS
  const totalTro =
    totalAtomic == null ? null : Number(totalAtomic) / 10 ** TRO_DECIMALS

  return {
    userTro,
    totalTro,
    userAtomic,
    totalAtomic,
    loading,
    error,
    refresh,
  }
}
