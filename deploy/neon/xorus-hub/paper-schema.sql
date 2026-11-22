-- New virtual operator pilot only; never an account balance, wallet grant or live order.
CREATE TABLE IF NOT EXISTS public.xorus_paper_pilots (
  pilot_id text PRIMARY KEY,
  revision integer NOT NULL CHECK (revision BETWEEN 0 AND 500),
  state jsonb NOT NULL CHECK ((
    jsonb_typeof(state) = 'object'
    AND state->>'mode' = 'paper_simulation'
    AND state->'virtual_capital' = 'true'::jsonb
    AND state->'execution_authorized' = 'false'::jsonb
    AND state->'signing_authorized' = 'false'::jsonb
    AND state->'live_budget_cents' = '0'::jsonb
    AND state->'revision' = to_jsonb(revision)
    AND jsonb_typeof(state->'events') = 'array'
    AND jsonb_array_length(state->'events') = revision
  ) IS TRUE),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
