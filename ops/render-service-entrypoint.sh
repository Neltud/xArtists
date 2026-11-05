#!/bin/sh
# Render two services use the same repo-root image: explicit role selection.
# The frontend is the backwards-compatible default for every existing service.
set -eu

case "${XARTISTS_ROLE:-frontend}" in
  api)
    # Never route API traffic to Nginx's SPA fallback.
    exec node /opt/xartists/access-api/src/server.mjs
    ;;
  frontend)
    # Render injects the deployed commit at runtime. Without a valid SHA
    # and a built release manifest, the public build-info route stays 404.
    # The browse-only frontend remains available independently of this stamp.
    if ! node /usr/local/lib/xartists/write-render-build-info.mjs; then
      echo "Render public build stamp unavailable" >&2
    fi
    exec nginx -g 'daemon off;'
    ;;
  *)
    echo "Invalid XARTISTS_ROLE (expected api or frontend)" >&2
    exit 64
    ;;
esac
