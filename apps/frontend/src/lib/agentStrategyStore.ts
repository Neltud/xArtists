/**
 * Config régime NFT Agent — localStorage liée au tokenId (paper / non-custodial).
 * Pas de dépôt utilisateur · pas d’exécution autonome.
 */

export type AgentRegime = 'soft' | 'balanced' | 'aggressive'

export type AgentStrategyConfig = {
  tokenId: string
  packId?: string
  regime: AgentRegime
  /** Cadence d’arbitrage : ticks / heure (ordre de grandeur UX) */
  cadencePerHour: number
  /** Seuil Blue Ribbon 0–1 (conviction min pour mettre en avant le signal) */
  blueRibbonThreshold: number
  updatedAt: number
  /** Signature xPortal optionnelle (hash message) */
  userSigHint?: string
}

const KEY = 'xartists_agent_strategy_v1'

function loadAll(): Record<string, AgentStrategyConfig> {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, AgentStrategyConfig>
    return j && typeof j === 'object' ? j : {}
  } catch {
    return {}
  }
}

function saveAll(map: Record<string, AgentStrategyConfig>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    /* quota */
  }
}

export function getStrategy(tokenId: string): AgentStrategyConfig | null {
  if (!tokenId) return null
  return loadAll()[tokenId] || null
}

export function defaultStrategy(tokenId: string, packId?: string): AgentStrategyConfig {
  return {
    tokenId,
    packId,
    regime: 'balanced',
    cadencePerHour: 4,
    blueRibbonThreshold: 0.55,
    updatedAt: Date.now(),
  }
}

export function saveStrategy(cfg: AgentStrategyConfig): AgentStrategyConfig {
  const next = { ...cfg, updatedAt: Date.now() }
  const all = loadAll()
  all[cfg.tokenId] = next
  saveAll(all)
  try {
    window.dispatchEvent(new CustomEvent('lia-agent-strategy', { detail: next }))
  } catch {
    /* */
  }
  return next
}

export const REGIME_META: Record<
  AgentRegime,
  { label: string; emoji: string; blurb: string }
> = {
  soft: {
    label: 'Prudent / Soft',
    emoji: '🛡️',
    blurb: 'Seuils élevés · peu de signaux · focus capital préservé (paper).',
  },
  balanced: {
    label: 'Équilibré',
    emoji: '⚖️',
    blurb: 'Cadence moyenne · Blue Ribbon modéré.',
  },
  aggressive: {
    label: 'Agressif',
    emoji: '⚡',
    blurb: 'Plus de ticks · seuil ribbon bas · densitée de signaux (paper).',
  },
}
