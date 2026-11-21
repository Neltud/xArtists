-- Dedicated sandbox table. No existing account, wallet or commerce data is touched.
CREATE TABLE IF NOT EXISTS public.xorus_platform_hub_state (
  organization_id text PRIMARY KEY CHECK (organization_id = 'xartists'),
  last_slot timestamptz,
  claim_id text,
  lease_until timestamptz,
  checked_at timestamptz,
  snapshot jsonb
);
