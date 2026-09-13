/** Demo fixtures for THE PULSE on static GitHub Pages (no live API required). */

export type PulseEnvironment = {
  type: 'ENVIRONMENT_UPDATE'
  sentiment: number
  intensity: 'low' | 'medium' | 'high'
  color_target: string
  vibe: string
  category: string
  asset?: string
  context?: string
}

export const PULSE_DEMO_CYCLE: PulseEnvironment[] = [
  {
    type: 'ENVIRONMENT_UPDATE',
    sentiment: 0.72,
    intensity: 'high',
    color_target: '#ffaa00',
    vibe: 'hype_event',
    category: 'MARKET_HYPE',
    asset: 'EGLD',
    context: 'Supernova narrative · constructive volume',
  },
  {
    type: 'ENVIRONMENT_UPDATE',
    sentiment: 0.41,
    intensity: 'medium',
    color_target: '#a78bfa',
    vibe: 'art_glow',
    category: 'ART_TREND',
    asset: 'ART',
    context: 'WebXR gallery · xArtists builders shipping',
  },
  {
    type: 'ENVIRONMENT_UPDATE',
    sentiment: 0.28,
    intensity: 'low',
    color_target: '#22d3ee',
    vibe: 'whale_calm',
    category: 'WHALE_MOVE',
    asset: 'HTM',
    context: 'Quiet accumulation talk',
  },
  {
    type: 'ENVIRONMENT_UPDATE',
    sentiment: -0.35,
    intensity: 'medium',
    color_target: '#64748b',
    vibe: 'crash_fog',
    category: 'SOCIAL_CRASH',
    asset: 'MACRO',
    context: 'Risk-off chatter · demo only',
  },
  {
    type: 'ENVIRONMENT_UPDATE',
    sentiment: 0.05,
    intensity: 'low',
    color_target: '#94a3b8',
    vibe: 'neutral',
    category: 'NEUTRAL',
    asset: 'MACRO',
    context: 'Pulse idle · paper demo',
  },
]
