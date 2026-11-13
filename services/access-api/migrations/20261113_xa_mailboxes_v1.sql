-- xArtists Mail: account-bound mailbox reservations only; MANUAL DBA review.
-- Does not install a mail server, create actual mailboxes or store mail bodies.
BEGIN;
CREATE TABLE IF NOT EXISTS xa_mailboxes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES xa_user_accounts(id) ON DELETE RESTRICT,
  address TEXT NOT NULL UNIQUE CHECK (address ~ '^[a-z][a-z0-9._-]{1,31}@xartists[.]art$'),
  provider_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','provisioned','needs_reconciliation','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT xa_mailbox_provisioned_has_provider CHECK (status <> 'provisioned' OR provider_id IS NOT NULL)
);
COMMIT;
