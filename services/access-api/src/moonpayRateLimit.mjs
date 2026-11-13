export function createMoonpayRateLimiter({
  windowMs = 60_000,
  maxPerNetwork = 30,
  maxPerOrigin = 300,
  maxNetworkKeys = 10_000,
  maxOriginKeys = 32,
  now = Date.now,
} = {}) {
  // Local-process protection. Do not trust user-controlled X-Forwarded-For.
  const networks = new Map()
  const origins = new Map()
  const purge = (map, time) => {
    for (const [key, entry] of map) if (entry.expiresAt <= time) map.delete(key)
  }
  const hasBudget = (map, key, limit, maxKeys) => {
    const entry = map.get(key)
    return entry ? entry.count < limit : map.size < maxKeys
  }
  const consume = (map, key, time) => {
    const entry = map.get(key)
    map.set(key, { count: (entry?.count || 0) + 1, expiresAt: entry?.expiresAt || time + windowMs })
  }
  return {
    allow({ network, origin } = {}) {
      const time = now()
      purge(networks, time)
      purge(origins, time)
      const networkKey = typeof network === 'string' && network ? network : '<unknown-network>'
      const originKey = typeof origin === 'string' && origin ? origin : '<no-origin>'
      // Both budgets must pass before either is consumed.
      if (!hasBudget(networks, networkKey, maxPerNetwork, maxNetworkKeys) ||
          !hasBudget(origins, originKey, maxPerOrigin, maxOriginKeys)) return false
      consume(networks, networkKey, time)
      consume(origins, originKey, time)
      return true
    },
  }
}
