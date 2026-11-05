export const TELEMETRY_TTL_SECONDS: number
export type TelemetryHealth = 'fresh' | 'provider_error' | 'offline' | 'invalid_timestamp' | 'clock_skew' | 'delayed'
export interface TelemetrySourceAssessment {
  source_ts: string | null
  published_at: string | null
  received_at: string
  provider: string
  data_mode: 'paper' | 'onchain' | 'market' | 'unknown'
  ttl_seconds: number
  is_stale: boolean
  source_health: TelemetryHealth
  age_minutes: number | null
}
export function assessTelemetrySource(input?: {
  source_ts?: string | null
  published_at?: string | null
  provider?: string
  data_mode?: string
  ttl_seconds?: number
  provider_ok?: boolean
}, nowMs?: number): Readonly<TelemetrySourceAssessment>
