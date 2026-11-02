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
    exec nginx -g 'daemon off;'
    ;;
  *)
    echo "Invalid XARTISTS_ROLE (expected api or frontend)" >&2
    exit 64
    ;;
esac
