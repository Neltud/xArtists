import { ORGANIZATION } from './registry.mjs'

/** SQL admission is shared by all isolates; local memory is never a global quota. */
export function createPostgresStore(pool) {
  return {
    async claim(slot, claimId) {
      const result = await pool.query(`
        INSERT INTO public.xorus_platform_hub_state (organization_id, claim_id, lease_until)
        VALUES ($1, $2, now() + interval '30 seconds')
        ON CONFLICT (organization_id) DO UPDATE
        SET claim_id = EXCLUDED.claim_id, lease_until = EXCLUDED.lease_until
        WHERE (xorus_platform_hub_state.lease_until IS NULL OR xorus_platform_hub_state.lease_until < now())
          AND (NOT COALESCE(xorus_platform_hub_state.snapshot ? 'network_agents', false) OR (
            (xorus_platform_hub_state.last_slot IS NULL OR xorus_platform_hub_state.last_slot < $3::timestamptz)
            AND (xorus_platform_hub_state.checked_at IS NULL OR xorus_platform_hub_state.checked_at < now() - interval '14 minutes')
          ))
        RETURNING organization_id`, [ORGANIZATION, claimId, slot])
      return result.rowCount === 1
    },
    async finish(slot, claimId, snapshot) {
      const result = await pool.query(`
        UPDATE public.xorus_platform_hub_state
        SET last_slot = $1, checked_at = now(), snapshot = $2::jsonb, lease_until = NULL
        WHERE organization_id = $3 AND claim_id = $4 AND lease_until > now()`,
      [slot, JSON.stringify(snapshot), ORGANIZATION, claimId])
      if (result.rowCount !== 1) throw new Error('probe_lease_lost')
    },
    async read() {
      const result = await pool.query('SELECT snapshot FROM public.xorus_platform_hub_state WHERE organization_id = $1', [ORGANIZATION])
      return result.rows[0]?.snapshot ?? null
    },
  }
}
