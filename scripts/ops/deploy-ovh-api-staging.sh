#!/usr/bin/env bash
# Operator-only OVH staging deployment. Invoked through a protected GitHub environment.
# Never touches production DNS, databases, email, checkout, mint, trading or IPFS upload flags.
set -Eeuo pipefail
umask 077

if [ "$#" -ne 1 ] || [[ ! "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo "staging_deploy_invalid_sha" >&2; exit 2
fi
sha="$1"
for binary in git docker curl flock; do
  command -v "$binary" >/dev/null || { echo "staging_deploy_missing_dependency:$binary" >&2; exit 2; }
done
docker compose version >/dev/null
base="$HOME/xartists-api-staging"
private_env="$base/config/.env.api"
[ -f "$private_env" ] && [ ! -L "$private_env" ] || {
  echo "staging_deploy_private_env_not_provisioned" >&2; exit 2
}
case "$(stat -c '%a' "$private_env")" in
  400|600) ;;
  *) echo "staging_deploy_private_env_permissions_not_private" >&2; exit 2 ;;
esac

install -d -m 0700 "$base/releases"
exec 9>"$base/.deploy.lock"
flock -n 9 || { echo "staging_deploy_already_running" >&2; exit 2; }

# First deployment must not claim ports used by another website.
if [ ! -L "$base/current" ]; then
  command -v ss >/dev/null || {
    echo "staging_deploy_cannot_verify_public_port_ownership" >&2; exit 2
  }
  if ss -ltnH | awk '{print $4}' | grep -Eq ':(80|443)$'; then
    echo "staging_deploy_public_ports_already_in_use" >&2; exit 2
  fi
fi

release="$base/releases/$sha"
if [ ! -d "$release/.git" ]; then
  git clone --filter=blob:none --depth 1 --no-checkout \
    https://github.com/Neltud/xArtists.git "$release"
fi
git -C "$release" fetch --depth 1 origin "$sha"
git -C "$release" checkout --detach "$sha"
[ "$(git -C "$release" rev-parse HEAD)" = "$sha" ] || {
  echo "staging_deploy_checkout_mismatch" >&2; exit 2
}
[ -f "$release/deploy/ovh/compose.yaml" ] && \
[ -f "$release/deploy/ovh/compose.staging-deploy.yaml" ] && \
[ -f "$release/services/access-api/Dockerfile" ] || {
  echo "staging_deploy_missing_release_files" >&2; exit 2
}

ln -sfn "$private_env" "$release/deploy/ovh/.env.api"
export API_HOSTNAME=api-staging.xartists.art
export XARTISTS_SOURCE_SHA="$sha"
export XARTISTS_STUDIO_UPLOAD_APPROVED=0
compose() {
  docker compose --project-name xartists-api-ovh \
    -f "$release/deploy/ovh/compose.yaml" \
    -f "$release/deploy/ovh/compose.staging-deploy.yaml" "$@"
}
compose config --quiet
compose build --pull api
compose up -d --no-build api proxy

# Verify actual running container, not merely a successful Compose invocation.
local_verified=0
for _ in $(seq 1 24); do
  if compose exec -T api node --input-type=module -e '
    const expected=process.env.XARTISTS_SOURCE_SHA
    const health=await fetch("http://127.0.0.1:8787/health",{signal:AbortSignal.timeout(4000)}).then(r=>r.json())
    const identity=await fetch("http://127.0.0.1:8787/v1/ops/build-info",{signal:AbortSignal.timeout(4000)}).then(r=>r.json())
    if(health.service!=="access-api"||health.mint_live_enabled!==false||
      health.paybox_checkout_enabled!==false||health.studio_media_upload!=="off"||
      identity.source_sha!==expected||identity.execution_authorized!==false)
      process.exit(1)
  ' >/dev/null 2>&1; then local_verified=1; break; fi
  sleep 5
done
if [ "$local_verified" -ne 1 ]; then
  echo "staging_deploy_local_health_or_safety_failed" >&2
  exit 1
fi

# No -k / insecure TLS: public SHA must be reachable via actual Caddy HTTPS.
public_verified=0
for _ in $(seq 1 12); do
  result="$(curl --fail --silent --show-error --max-time 12 \
    https://api-staging.xartists.art/v1/ops/build-info 2>/dev/null || true)"
  if [[ "$result" == *"\"source_sha\":\"$sha\""* ]] &&
     [[ "$result" == *'"service":"access-api"'* ]] &&
     [[ "$result" == *'"execution_authorized":false'* ]]; then
    public_verified=1
    break
  fi
  sleep 5
done
if [ "$public_verified" -ne 1 ]; then
  echo "staging_deploy_public_https_or_sha_unverified" >&2
  # A failed public probe is NO-GO. Never claim success or change xartists.art.
  # Preserve running containers for operator diagnosis rather than blindly
  # overwriting an earlier deployment with an unproven rollback.
  exit 1
fi

ln -sfn "$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
echo "OVH_STAGING_API_VERIFIED sha=$sha host=api-staging.xartists.art upload=off finance=off"
