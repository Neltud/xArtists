-- xArtists Mail: account-bound mailbox reservations ONLY; MANUAL DBA review.
-- No MTA, SMTP, JMAP, IMAP, password, message body or production mailboxes.
BEGIN;
CREATE TABLE IF NOT EXISTS xa_mailboxes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES xa_user_accounts(id) ON DELETE RESTRICT,
  address TEXT NOT NULL UNIQUE,
  CONSTRAINT xa_mailbox_canonical_name CHECK (
    address ~ '^[a-z][a-z0-9]*([._-][a-z0-9]+)*@xartists[.]art$'
    AND length(split_part(address,'@',1)) BETWEEN 3 AND 32
  ),
  -- Defence in depth: privileged inserts cannot squat operational addresses.
  CONSTRAINT xa_mailbox_reserved_name CHECK (
    split_part(address,'@',1) <> ALL (ARRAY[
      'abuse','admin','administrator','adminsys','billing','contact','dmarc',
      'hello','hostmaster','info','legal','mailer-daemon','mail','noreply',
      'no-reply','postmaster','privacy','root','security','support','webmaster',
      'www','sales','smtp','imap','pop','help','test'
    ])
  ),
  provider_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved','provisioned','needs_reconciliation','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT xa_mailbox_provisioned_has_provider CHECK (
    status <> 'provisioned' OR provider_id IS NOT NULL
  )
);
COMMIT;
