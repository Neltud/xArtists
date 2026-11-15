#!/usr/bin/env bash
# Read-only OVH staging audit. Never prints .env.api or credentials.
set -euo pipefail
cd "$(dirname "$0")"
fail=0
check() {
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then printf 'PASS %s\n' "$label"
  else printf 'FAIL %s\n' "$label"; fail=1; fi
}
check 'Docker available' docker version
check 'Docker Compose v2 available' docker compose version
check 'Compose schema valid (no container start)' docker compose config --quiet
if [[ -z "${API_HOSTNAME:-}" ]]; then
  printf 'FAIL API_HOSTNAME missing (staging hostname only)\n'; fail=1
elif [[ "$API_HOSTNAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]] && [[ "$API_HOSTNAME" != "xartists.art" && "$API_HOSTNAME" != "www.xartists.art" ]]; then
  printf 'PASS staging hostname format\n'
else
  printf 'FAIL API_HOSTNAME must be a non-production DNS hostname\n'; fail=1
fi
if [[ ! -f .env.api ]]; then
  printf 'FAIL .env.api absent (no secrets requested here)\n'; fail=1
else
  chmod 600 .env.api
  printf 'PASS local env file present; permissions restricted\n'
fi
# Does not access the database, deploy, open ports, or change DNS.
if (( fail )); then printf 'NO-GO: preflight failed; no deployment performed\n'; exit 1; fi
printf 'READY FOR OPERATOR REVIEW ONLY; no deployment or commercial authorization\n'
