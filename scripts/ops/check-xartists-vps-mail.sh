#!/usr/bin/env bash
# Read-only OVH VPS mail inventory. No aliases, logs or credentials printed.
set -euo pipefail
printf '%s\n' 'xArtists mail receiver: read-only audit; no SMTP delivery asserted'
printf '%s\n' 'Expected MX: mail.xartists.art; OVH VPS 146.59.146.223'
for bin in postconf exim exim4 dovecot docker podman; do
  if command -v "$bin" >/dev/null 2>&1; then printf 'Binary detected: %s\n' "$bin"; fi
done
if command -v systemctl >/dev/null 2>&1; then
  for svc in postfix exim4 dovecot opendkim rspamd; do
    value="$(systemctl is-active "$svc" 2>/dev/null || true)"
    printf 'Service %-12s %s\n' "$svc" "$value"
  done
fi
if command -v postconf >/dev/null 2>&1; then
  for key in myhostname mydestination virtual_alias_maps virtual_mailbox_domains \
    virtual_mailbox_maps alias_maps relay_domains; do
    value="$(postconf -h "$key" 2>/dev/null || true)"
    if [ -z "$value" ]; then
      printf 'Postfix key %-26s empty\n' "$key"
    else
      printf 'Postfix key %-26s present\n' "$key"
    fi
  done
fi
if command -v ss >/dev/null 2>&1; then
  listeners="$(ss -H -ltn 2>/dev/null || true)"
  for port in 25 465 587 993; do
    if printf '%s\n' "$listeners" | awk '{print $4}' | grep -Eq "[:.]$port$"; then
      printf 'TCP port %s listener: present\n' "$port"
    else printf 'TCP port %s listener: not observed\n' "$port"; fi
  done
fi
printf '%s\n' 'No changes made; identify the actual recipient map before configuring forwarding.'
