---
name: mailbox-provisioning
description: Provision and verify a real xArtists account-linked @xartists.art mailbox, then safely manage its inbox and outbound mail, using authenticated owner-approved infrastructure only. Do not conflate DNS, aliases, or email OTP accounts with full inboxes.
---

# xArtists Mail — opérateur et sécurité

Use when the user asks to create, access, verify, repair, or administer an `@xartists.art` mailbox attached to a xArtists user account. Reply in the user's language.

## Source of truth

- Repository `Neltud/xArtists`, runbook `docs/ops/XARTISTS_USER_MAILBOXES_2026-11-13.md`.
- The MX observed in November 2026 is `mail.xartists.art` on an OVH VPS. This does not prove a mailbox, server software, or delivery. Check authoritative DNS afresh.
- xArtists user identity must be resolved from authenticated server-side Neon Ed25519 JWT to `xa_user_accounts.id`; never accept a client-provided account ID or wallet address alone.
- Code `services/access-api/src/mailboxProvisioning.mjs` + `mailboxRepository.mjs` + manual SQL migration.
- This plugin v0.1.0 is a **guarded skill without an authenticated MCP mail provider**. Never claim it can actually create, send or read messages until the provider API is connected and certified.

## Provisioning procedure

1. Identify actual OVH MX recipient software from an authorized administrator (Mailcow, Stalwart, Postfix+Dovecot, Plesk, MX Plan or other). Never guess or overwrite MX.
2. Confirm TLS, webmail or JMAP/IMAP, authenticated SMTP, DKIM/SPF/DMARC/PTR, quotas, backups/restore, anti-spam, logging and recovery. Do not request credentials, keys or passwords in chat.
3. Verify user's current signed identity server-side, active account UUID, consent and name availability. One real mailbox per account by default; block reserved role addresses.
4. Require an approved authenticated provider API; create an **independent inbox** with login/SSO, not a forwarding alias. Do not reveal mail administrator secrets or generated passwords.
5. Use atomic reservation and idempotency; if provider outcome is uncertain, mark `needs_reconciliation` rather than retrying automatically. A provider acknowledgment yields `provisioned`, never `email_send_receive_verified=true`.
6. Test from Gmail and a second independent provider, confirm actual mailbox receipt and one authenticated outbound reply, DKIM/SPF/DMARC. Verify inbox read/send/drafts/logout/recovery/attachments and account A/B isolation before enabling user-facing live mail.

## Privacy and authorization

- User may access **only their own** mailbox and explicit requested messages. Never access private customer mail without authorization.
- Admin sees provisioning metadata, not message bodies by default. Forwards, suspension/deletion, and bulk emails require specific human approval and scoped permissions.
- Never store mail body or IMAP password in GitHub, analytics, browser localStorage, or a public issue. No mass marketing without opt-in and abuse protections.
- No finance/mint/trade feature activated by account-mail creation.

## Fail closed

If the verified mail server, authenticated identity or provider adapter is absent, return `mailbox_service_unavailable`, explain exact missing evidence, and do not invent new inboxes. The existing business contact issue #341 remains independent until actual hello@ reception and reply are proven.
